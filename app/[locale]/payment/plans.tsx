'use client'

import { useState } from 'react'

interface PaymentPlansProps {
  locale: string
  currentSubscription?: string
}

export default function PaymentPlans({
  currentSubscription,
}: PaymentPlansProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (type: 'single' | 'subscription' | 'topup') => {
    try {
      setLoading(type)
      setError(null)

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment creation failed')
      }

      const { paymentUrl } = await response.json()

      // Redirect to Payten payment page
      if (paymentUrl) {
        window.location.href = paymentUrl
      } else {
        throw new Error('No payment URL received')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create payment')
      setLoading(null)
    }
  }

  return (
    <div>
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400">❌</span>
            <span className="text-red-800 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Single Reading */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔮</div>
            <h3 className="text-2xl font-bold mb-2">Single Reading</h3>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              $1.99
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              One-time purchase
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">1 reading credit</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Never expires</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">All reading types</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Audio included</span>
            </li>
          </ul>

          <button
            onClick={() => handlePurchase('single')}
            disabled={loading === 'single'}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-full transition-colors"
          >
            {loading === 'single' ? 'Processing...' : 'Buy Now'}
          </button>
        </div>

        {/* Monthly Subscription */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 shadow-xl transform scale-105 relative">
          <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
            BEST VALUE
          </div>

          <div className="text-center mb-6 text-white">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="text-2xl font-bold mb-2">Monthly Subscription</h3>
            <div className="text-4xl font-bold mb-2">
              $9.99
            </div>
            <p className="text-purple-100">
              Billed monthly
            </p>
          </div>

          <ul className="space-y-3 mb-8 text-white">
            <li className="flex items-center gap-2">
              <span className="text-yellow-300">✓</span>
              <span className="text-sm">12 readings per month</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-300">✓</span>
              <span className="text-sm">Save 33% vs. single</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-300">✓</span>
              <span className="text-sm">Cancel anytime</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-300">✓</span>
              <span className="text-sm">Priority support</span>
            </li>
          </ul>

          <button
            onClick={() => handlePurchase('subscription')}
            disabled={loading === 'subscription' || currentSubscription === 'active'}
            className="w-full bg-white text-purple-600 hover:bg-purple-50 disabled:bg-gray-200 disabled:text-gray-500 font-semibold py-3 rounded-full transition-colors"
          >
            {currentSubscription === 'active'
              ? 'Already Subscribed'
              : loading === 'subscription'
              ? 'Processing...'
              : 'Subscribe Now'}
          </button>
        </div>

        {/* Top-Up Package */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-2xl font-bold mb-2">Top-Up Package</h3>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              $9.99
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              One-time purchase
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">10 reading credits</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Save 50% vs. single</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Never expires</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Perfect for gifting</span>
            </li>
          </ul>

          <button
            onClick={() => handlePurchase('topup')}
            disabled={loading === 'topup'}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-full transition-colors"
          >
            {loading === 'topup' ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
