/**
 * Payten Payment Gateway Integration
 *
 * Payten is a payment processor for Southeast Europe
 * Documentation: https://payten.com/docs/api
 */

import { createHmac } from 'crypto'

export type PaymentType = 'single' | 'subscription' | 'topup'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface PaytenConfig {
  apiKey: string
  merchantId: string
  environment: 'sandbox' | 'production'
}

export interface PaymentRequest {
  amount: number // In cents (e.g., 199 for $1.99)
  currency: string // 'USD', 'EUR', etc.
  orderId: string // Unique order identifier
  customerId: string // User ID
  returnUrl: string // URL to redirect after payment
  cancelUrl: string // URL if payment is cancelled
  description: string
  metadata?: Record<string, string>
}

export interface PaymentResponse {
  success: boolean
  paymentId: string
  paymentUrl?: string // URL to redirect user for payment
  status: PaymentStatus
  error?: string
}

export interface WebhookPayload {
  eventType: 'payment.completed' | 'payment.failed' | 'payment.refunded'
  paymentId: string
  orderId: string
  amount: number
  currency: string
  status: PaymentStatus
  timestamp: string
  signature: string
}

/**
 * Get Payten configuration from environment
 */
export function getPaytenConfig(): PaytenConfig {
  const apiKey = process.env.PAYTEN_API_KEY
  const merchantId = process.env.PAYTEN_MERCHANT_ID
  const environment = (process.env.PAYTEN_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'

  if (!apiKey || !merchantId) {
    throw new Error('Payten credentials not configured. Set PAYTEN_API_KEY and PAYTEN_MERCHANT_ID.')
  }

  return {
    apiKey,
    merchantId,
    environment,
  }
}

/**
 * Get Payten API base URL
 */
export function getPaytenApiUrl(environment: 'sandbox' | 'production'): string {
  return environment === 'production'
    ? 'https://api.payten.com/v1'
    : 'https://sandbox.payten.com/v1'
}

/**
 * Create payment session with Payten
 */
export async function createPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    const config = getPaytenConfig()
    const apiUrl = getPaytenApiUrl(config.environment)

    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Merchant-Id': config.merchantId,
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        order_id: request.orderId,
        customer_id: request.customerId,
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl,
        description: request.description,
        metadata: request.metadata,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Payment creation failed')
    }

    const data = await response.json()

    return {
      success: true,
      paymentId: data.id,
      paymentUrl: data.payment_url,
      status: 'pending',
    }
  } catch (error) {
    console.error('Payten payment creation error:', error)
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verify payment status with Payten
 */
export async function verifyPayment(paymentId: string): Promise<PaymentResponse> {
  try {
    const config = getPaytenConfig()
    const apiUrl = getPaytenApiUrl(config.environment)

    const response = await fetch(`${apiUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Merchant-Id': config.merchantId,
      },
    })

    if (!response.ok) {
      throw new Error('Payment verification failed')
    }

    const data = await response.json()

    return {
      success: data.status === 'completed',
      paymentId: data.id,
      status: data.status as PaymentStatus,
    }
  } catch (error) {
    console.error('Payten payment verification error:', error)
    return {
      success: false,
      paymentId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verify webhook signature to ensure it's from Payten
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const config = getPaytenConfig()

    // Create HMAC signature using API key as secret
    const expectedSignature = createHmac('sha256', config.apiKey)
      .update(payload)
      .digest('hex')

    return expectedSignature === signature
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

/**
 * Process refund for a payment
 */
export async function refundPayment(
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<PaymentResponse> {
  try {
    const config = getPaytenConfig()
    const apiUrl = getPaytenApiUrl(config.environment)

    const response = await fetch(`${apiUrl}/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Merchant-Id': config.merchantId,
      },
      body: JSON.stringify({
        amount, // Optional: full refund if not specified
        reason,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Refund failed')
    }

    const data = await response.json()

    return {
      success: true,
      paymentId: data.id,
      status: 'refunded',
    }
  } catch (error) {
    console.error('Payten refund error:', error)
    return {
      success: false,
      paymentId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get payment pricing configuration
 */
export const PRICING = {
  single: {
    amount: 199, // $1.99 in cents
    credits: 1,
    currency: 'USD',
    description: 'Single Reading',
  },
  subscription: {
    amount: 999, // $9.99 in cents
    credits: 12,
    currency: 'USD',
    description: 'Monthly Subscription - 12 Readings',
    interval: 'month',
  },
  topup: {
    amount: 999, // $9.99 in cents
    credits: 10,
    currency: 'USD',
    description: 'Top-Up Package - 10 Readings',
  },
} as const
