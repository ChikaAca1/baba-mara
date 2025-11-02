'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('Global Error:', error)

    // Attempt to log to error service
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: 'GLOBAL_ERROR',
          error_message: error.message,
          stack_trace: error.stack,
          severity: 'critical',
          endpoint: window.location.pathname,
        }),
      }).catch(console.error)
    }
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border-2 border-red-200">
            {/* Critical Error Icon */}
            <div className="text-8xl mb-6">🚨</div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Critical Error
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-700 mb-2">
              A critical error occurred
            </p>

            {/* Message */}
            <p className="text-sm text-gray-600 mb-8">
              We&apos;re very sorry, but something went critically wrong. Our team has been
              automatically notified. Please try refreshing the page.
            </p>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-red-50 p-4 rounded-lg mb-6 border border-red-300">
                <summary className="cursor-pointer font-medium text-red-800 hover:text-red-900">
                  🔍 Error Details (Development Only)
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <span className="text-xs font-semibold text-red-700">Message:</span>
                    <pre className="mt-1 text-xs text-red-600 overflow-auto bg-red-100 p-2 rounded">
{error.message}
                    </pre>
                  </div>
                  {error.stack && (
                    <div>
                      <span className="text-xs font-semibold text-red-700">Stack Trace:</span>
                      <pre className="mt-1 text-xs text-red-600 overflow-auto bg-red-100 p-2 rounded max-h-40">
{error.stack}
                      </pre>
                    </div>
                  )}
                  {error.digest && (
                    <div>
                      <span className="text-xs font-semibold text-red-700">Error ID:</span>
                      <code className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
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
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
              >
                Go to Homepage
              </button>
            </div>

            {/* Support Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Error ID: {error.digest || 'N/A'}<br />
                If this persists, please contact support
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
