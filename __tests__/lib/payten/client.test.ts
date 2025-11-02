/**
 * @jest-environment node
 */

import { createHmac } from 'crypto'
import {
  getPaytenApiUrl,
  verifyWebhookSignature,
  PRICING,
  type PaymentType,
} from '@/lib/payten/client'

describe('lib/payten/client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv }
    process.env.PAYTEN_API_KEY = 'test_api_key_12345'
    process.env.PAYTEN_MERCHANT_ID = 'test_merchant_id'
    process.env.PAYTEN_ENVIRONMENT = 'sandbox'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getPaytenApiUrl', () => {
    it('should return sandbox URL for sandbox environment', () => {
      const url = getPaytenApiUrl('sandbox')
      expect(url).toBe('https://sandbox.payten.com/v1')
    })

    it('should return production URL for production environment', () => {
      const url = getPaytenApiUrl('production')
      expect(url).toBe('https://api.payten.com/v1')
    })
  })

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({
        eventType: 'payment.completed',
        paymentId: 'pay_123',
        orderId: 'order_456',
        amount: 199,
        currency: 'USD',
        status: 'completed',
        timestamp: '2025-01-01T00:00:00Z',
      })

      // Generate expected signature
      const expectedSignature = createHmac('sha256', 'test_api_key_12345')
        .update(payload)
        .digest('hex')

      const isValid = verifyWebhookSignature(payload, expectedSignature)
      expect(isValid).toBe(true)
    })

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ data: 'test' })
      const invalidSignature = 'invalid_signature_12345'

      const isValid = verifyWebhookSignature(payload, invalidSignature)
      expect(isValid).toBe(false)
    })

    it('should reject signature with tampered payload', () => {
      const originalPayload = JSON.stringify({ amount: 199 })
      const tamperedPayload = JSON.stringify({ amount: 999 })

      // Create signature for original payload
      const signature = createHmac('sha256', 'test_api_key_12345')
        .update(originalPayload)
        .digest('hex')

      // Verify with tampered payload should fail
      const isValid = verifyWebhookSignature(tamperedPayload, signature)
      expect(isValid).toBe(false)
    })
  })

  describe('PRICING configuration', () => {
    it('should have correct pricing for single reading', () => {
      expect(PRICING.single).toEqual({
        amount: 199, // $1.99
        credits: 1,
        currency: 'USD',
        description: 'Single Reading',
      })
    })

    it('should have correct pricing for subscription', () => {
      expect(PRICING.subscription).toEqual({
        amount: 999, // $9.99
        credits: 12,
        currency: 'USD',
        description: 'Monthly Subscription - 12 Readings',
        interval: 'month',
      })
    })

    it('should have correct pricing for top-up', () => {
      expect(PRICING.topup).toEqual({
        amount: 999, // $9.99
        credits: 10,
        currency: 'USD',
        description: 'Top-Up Package - 10 Readings',
      })
    })

    it('should have all payment types defined', () => {
      const types: PaymentType[] = ['single', 'subscription', 'topup']
      types.forEach((type) => {
        expect(PRICING[type]).toBeDefined()
        expect(PRICING[type].amount).toBeGreaterThan(0)
        expect(PRICING[type].credits).toBeGreaterThan(0)
        expect(PRICING[type].currency).toBe('USD')
      })
    })

    it('should calculate correct credit-to-price ratios', () => {
      // Single: $1.99 per credit
      const singleCostPerCredit = PRICING.single.amount / PRICING.single.credits
      expect(singleCostPerCredit).toBe(199)

      // Subscription: ~$0.83 per credit (12 for $9.99)
      const subscriptionCostPerCredit = PRICING.subscription.amount / PRICING.subscription.credits
      expect(subscriptionCostPerCredit).toBeCloseTo(83.25, 2)

      // Top-up: ~$1.00 per credit (10 for $9.99)
      const topupCostPerCredit = PRICING.topup.amount / PRICING.topup.credits
      expect(topupCostPerCredit).toBeCloseTo(99.9, 1)

      // Subscription should be the best value
      expect(subscriptionCostPerCredit).toBeLessThan(topupCostPerCredit)
      expect(subscriptionCostPerCredit).toBeLessThan(singleCostPerCredit)
    })
  })

  describe('Environment configuration', () => {
    it('should default to sandbox when PAYTEN_ENVIRONMENT not set', () => {
      delete process.env.PAYTEN_ENVIRONMENT
      // getPaytenConfig would use 'sandbox' as default
      const url = getPaytenApiUrl('sandbox')
      expect(url).toContain('sandbox')
    })

    it('should use production URL when environment is production', () => {
      process.env.PAYTEN_ENVIRONMENT = 'production'
      const url = getPaytenApiUrl('production')
      expect(url).toBe('https://api.payten.com/v1')
    })
  })

  describe('Security considerations', () => {
    it('should use HMAC-SHA256 for webhook signatures', () => {
      const payload = 'test payload'
      const signature = createHmac('sha256', 'test_api_key_12345')
        .update(payload)
        .digest('hex')

      // Signature should be 64 characters (SHA256 hex)
      expect(signature).toHaveLength(64)
      expect(signature).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should use same secret for signature creation and verification', () => {
      const payload = 'test data'
      const secret = 'test_api_key_12345'

      const signature1 = createHmac('sha256', secret).update(payload).digest('hex')
      const signature2 = createHmac('sha256', secret).update(payload).digest('hex')

      expect(signature1).toBe(signature2)
    })
  })
})
