import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/payten/client'

/**
 * Verify payment status
 * POST /api/payment/verify
 * Body: { transactionId: string }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get transaction ID
    const { transactionId }: { transactionId: string } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    // Get transaction from database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', user.id) // Ensure user owns this transaction
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // If transaction is already completed, return status
    if (transaction.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        transaction,
      })
    }

    // Verify payment with Payten
    if (transaction.payment_id) {
      const paymentResponse = await verifyPayment(transaction.payment_id)

      // Update transaction status if it changed
      if (paymentResponse.status !== transaction.status) {
        await supabase
          .from('transactions')
          .update({ status: paymentResponse.status })
          .eq('id', transaction.id)

        transaction.status = paymentResponse.status
      }

      return NextResponse.json({
        success: paymentResponse.success,
        status: paymentResponse.status,
        transaction,
      })
    }

    return NextResponse.json({
      success: false,
      status: transaction.status,
      transaction,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      {
        error: 'Failed to verify payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
