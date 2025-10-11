import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Unauthorized icon */}
        <div className="mb-8">
          <div className="inline-block">
            <div className="w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-8xl">🚫</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-red-600">
            Access Denied
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            You don&apos;t have permission to access this page
          </p>
        </div>

        {/* Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Why am I seeing this?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page is restricted to administrators only. If you believe you should have access, please contact support.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
              Need Admin Access?
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Contact our team at{' '}
              <a href="mailto:admin@baba-mara.com" className="underline">
                admin@baba-mara.com
              </a>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}/dashboard`}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-full text-center transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href={`/${locale}`}
            className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-4 px-8 rounded-full text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
