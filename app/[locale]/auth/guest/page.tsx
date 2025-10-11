'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/supabase/types'

export default function GuestModePage() {
  const t = useTranslations('Auth')
  const tReading = useTranslations('Reading')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGuestMode = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Sign in anonymously (guest mode)
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create guest session')
      }

      // Create guest user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: `guest-${authData.user.id}@baba-mara.com`,
        full_name: 'Guest User',
        locale,
        available_credits: 1, // Give 1 free credit to guest users
        total_credits_purchased: 0,
        is_guest: true,
        is_admin: false,
      })

      if (profileError) {
        // If profile already exists, it's fine (user might be returning guest)
        console.log('Profile error (might be existing guest):', profileError)
      }

      // Redirect to reading page
      router.push(`/${locale}/reading`)
    } catch (err) {
      console.error('Guest mode error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create guest session')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{t('guestMode')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Try Baba Mara with one free reading - no account required!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Create an account later to save your reading history and get more credits.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm text-purple-900 dark:text-purple-300">
              ⚡ {tReading('disclaimer')}
            </p>
          </div>

          {/* Guest Features */}
          <div className="mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm">1 free fortune reading (coffee or tarot)</span>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm">AI-powered mystical guidance</span>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm">No email or registration required</span>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Your session will expire after 24 hours
              </span>
            </div>
          </div>

          {/* Guest Mode Button */}
          <button
            onClick={handleGuestMode}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {loading ? t('loading') : 'Try Free Reading Now'}
          </button>

          {/* Sign Up CTA */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Want unlimited readings?
            </p>
            <Link
              href={`/${locale}/auth/signup`}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Create a free account →
            </Link>
          </div>
        </div>

        {/* Back to Sign In */}
        <div className="mt-6 text-center">
          <Link href={`/${locale}/auth/signin`} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
            ← {t('hasAccount')}
          </Link>
        </div>
      </div>
    </div>
  )
}
