'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { logClientError } from '@/lib/errors/errorHandler'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Error')

  useEffect(() => {
    // Log error to our error tracking system
    logClientError(error, 'high')
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-purple-100 dark:border-purple-800">
        {/* Error Icon */}
        <div className="text-7xl mb-6">⚠️</div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {t('title')}
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          {t('subtitle')}
        </p>

        {/* Message */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('message')}
        </p>

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 border border-red-200 dark:border-red-800">
            <summary className="cursor-pointer font-medium text-red-800 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
              🔍 Error Details (Development Only)
            </summary>
            <div className="mt-3 space-y-2">
              <div>
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">Message:</span>
                <pre className="mt-1 text-xs text-red-600 dark:text-red-300 overflow-auto bg-red-100 dark:bg-red-900/30 p-2 rounded">
{error.message}
                </pre>
              </div>
              {error.stack && (
                <div>
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">Stack Trace:</span>
                  <pre className="mt-1 text-xs text-red-600 dark:text-red-300 overflow-auto bg-red-100 dark:bg-red-900/30 p-2 rounded max-h-40">
{error.stack}
                  </pre>
                </div>
              )}
              {error.digest && (
                <div>
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">Error ID:</span>
                  <code className="ml-2 text-xs text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                    {error.digest}
                  </code>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
          >
            {t('tryAgain')}
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors inline-block"
          >
            {t('goHome')}
          </Link>
        </div>

        {/* Support Link */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('contactSupport')}
          </p>
        </div>
      </div>
    </div>
  )
}
