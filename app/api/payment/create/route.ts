import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPayment, PRICING, type PaymentType } from '@/lib/payten/client'
import { ApiError, handleApiError } from '@/lib/api/errorResponse'

/**
 * Create payment session
 * POST /api/payment/create
 * Body: { type: 'single' | 'subscription' | 'topup' }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return ApiError.unauthorized('You must be logged in to create a payment')
    }

    // Get payment type from request
    const { type }: { type: PaymentType } = await request.json()

    if (!type || !['single', 'subscription', 'topup'].includes(type)) {
      return ApiError.invalidInput('type', 'Must be one of: single, subscription, topup')
    }

    // Get pricing info
    const pricing = PRICING[type]

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        transaction_type: type,
        amount: pricing.amount / 100, // Convert cents to dollars
        currency: pricing.currency,
        status: 'pending',
        description: pricing.description,
        credits_purchased: pricing.credits,
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      return ApiError.processingError('Failed to create transaction record', {
        error: transactionError?.message,
      })
    }

    // Get app URL for return/cancel URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Get user's locale from profile or default to 'en'
    const { data: profile } = await supabase
      .from('users')
      .select('locale')
      .eq('id', user.id)
      .single()

    const locale = profile?.locale || 'en'

    // Create payment with Payten
    const paymentResponse = await createPayment({
      amount: pricing.amount,
      currency: pricing.currency,
      orderId: transaction.id,
      customerId: user.id,
      returnUrl: `${appUrl}/${locale}/payment/success?transaction_id=${transaction.id}`,
      cancelUrl: `${appUrl}/${locale}/payment/cancel?transaction_id=${transaction.id}`,
      description: pricing.description,
      metadata: {
        user_id: user.id,
        transaction_id: transaction.id,
        payment_type: type,
        credits: pricing.credits.toString(),
      },
    })

    if (!paymentResponse.success) {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id)

      return ApiError.paymentFailed(paymentResponse.error || 'Payment creation failed', {
        paymentProvider: 'payten',
        transactionId: transaction.id,
      })
    }

    // Update transaction with payment ID
    await supabase
      .from('transactions')
      .update({
        payment_id: paymentResponse.paymentId,
        payment_method: 'payten',
      })
      .eq('id', transaction.id)

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.paymentUrl,
      transactionId: transaction.id,
      paymentId: paymentResponse.paymentId,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/payment/create')
  }
}
