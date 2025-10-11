import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, type WebhookPayload } from '@/lib/payten/client'

/**
 * Payten webhook handler
 * POST /api/payment/webhook
 *
 * Handles payment status updates from Payten
 */
export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('x-payten-signature') || ''

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(body)

    const supabase = await createClient()

    // Find transaction by order ID (which is transaction.id)
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', payload.orderId)
      .single()

    if (transactionError || !transaction) {
      console.error('Transaction not found:', payload.orderId)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Handle different event types
    switch (payload.eventType) {
      case 'payment.completed':
        await handlePaymentCompleted(transaction)
        break

      case 'payment.failed':
        await handlePaymentFailed(transaction)
        break

      case 'payment.refunded':
        await handlePaymentRefunded(transaction)
        break

      default:
        console.log('Unknown event type:', payload.eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)

    // Log webhook error
    try {
      const supabase = await createClient()
      await supabase.from('error_logs').insert({
        user_id: null,
        error_type: 'webhook_processing_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : null,
        endpoint: '/api/payment/webhook',
        severity: 'high',
      })
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentCompleted(
  transaction: Record<string, unknown>
) {
  const supabase = await createClient()

  try {
    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)

    // Add credits to user account
    const { error: creditError } = await supabase.rpc('add_user_credits', {
      p_user_id: transaction.user_id,
      p_credits: transaction.credits_purchased,
    })

    if (creditError) {
      throw new Error('Failed to add credits to user account')
    }

    // If subscription, update user subscription status
    if (transaction.transaction_type === 'subscription') {
      const renewsAt = new Date()
      renewsAt.setMonth(renewsAt.getMonth() + 1) // Add 1 month

      await supabase
        .from('subscriptions')
        .insert({
          user_id: transaction.user_id,
          status: 'active',
          plan_type: 'monthly',
          amount: transaction.amount,
          currency: transaction.currency,
          started_at: new Date().toISOString(),
          renews_at: renewsAt.toISOString(),
        })

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_renews_at: renewsAt.toISOString(),
        })
        .eq('id', transaction.user_id)
    }

    console.log('Payment completed successfully:', transaction.id)
  } catch (error) {
    console.error('Error handling payment completion:', error)

    // Log error
    await supabase.from('error_logs').insert({
      user_id: transaction.user_id,
      error_type: 'payment_completion_error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_stack: error instanceof Error ? error.stack : null,
      endpoint: '/api/payment/webhook',
      severity: 'critical',
    })

    throw error
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(transaction: Record<string, unknown>) {
  const supabase = await createClient()

  try {
    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)

    console.log('Payment failed:', transaction.id)
  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

/**
 * Handle refunded payment
 */
async function handlePaymentRefunded(
  transaction: Record<string, unknown>
) {
  const supabase = await createClient()

  try {
    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'refunded',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)

    // Deduct credits from user (if they still have them)
    await supabase.rpc('deduct_user_credits', {
      p_user_id: transaction.user_id,
      p_credits: transaction.credits_purchased,
    })

    console.log('Payment refunded:', transaction.id)
  } catch (error) {
    console.error('Error handling payment refund:', error)
    throw error
  }
}
