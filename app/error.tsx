'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logClientError } from '@/lib/errors/errorHandler'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to our error tracking system
    logClientError(error, 'high')
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Something went wrong!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We&apos;re sorry, but an unexpected error occurred. Our team has been notified and is working on a fix.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
            <summary className="cursor-pointer font-medium text-red-800 dark:text-red-400">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto max-h-60">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600">
                Error ID: {error.digest}
              </p>
            )}
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors inline-block"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
