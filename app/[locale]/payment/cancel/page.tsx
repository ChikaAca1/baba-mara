import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/actions'
import Link from 'next/link'

export default async function PaymentCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/auth/signin`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Cancel icon */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-6xl">⚠️</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-orange-600">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Your payment was not completed
          </p>
        </div>

        {/* Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">What Happened?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your payment was cancelled or did not complete successfully. No charges have been made to your account.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              If you encountered any issues during checkout, please contact our support team at{' '}
              <a href="mailto:support@baba-mara.com" className="underline">
                support@baba-mara.com
              </a>
            </p>
          </div>
        </div>

        {/* Common reasons */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="font-bold mb-3">Common Reasons for Cancellation:</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>Payment window was closed before completion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>Insufficient funds or card declined</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>Payment information was entered incorrectly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span>Browser or network connection issues</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/${locale}/payment`}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-full text-center transition-colors"
          >
            Try Again
          </Link>
          <Link
            href={`/${locale}/dashboard`}
            className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-4 rounded-full text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>

        {/* Alternative options */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Still want to use Baba Mara?
          </p>
          <Link
            href={`/${locale}/auth/guest`}
            className="text-purple-600 hover:underline text-sm font-medium"
          >
            Try as Guest (1 Free Reading)
          </Link>
        </div>
      </div>
    </div>
  )
}
