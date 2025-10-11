import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ transaction_id?: string }>
}) {
  const { locale } = await params
  const { transaction_id } = await searchParams
  setRequestLocale(locale)

  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/auth/signin`)
  }

  let transaction = null
  let userData = null

  if (transaction_id) {
    const supabase = await createClient()

    // Get transaction details
    const { data: transactionData } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .eq('user_id', user.id)
      .single()

    transaction = transactionData

    // Get updated user credits
    const { data: userDataResponse } = await supabase
      .from('users')
      .select('available_credits, subscription_status')
      .eq('id', user.id)
      .single()

    userData = userDataResponse
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success animation */}
        <div className="text-center mb-8">
          <div className="inline-block animate-bounce mb-4">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-6xl">✅</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-green-600">
            Payment Successful!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Your payment has been processed successfully
          </p>
        </div>

        {/* Transaction details */}
        {transaction && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg mb-6">
            <h2 className="text-2xl font-bold mb-6">Transaction Details</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-bold capitalize">{transaction.transaction_type}</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-bold">
                  ${transaction.amount.toFixed(2)} {transaction.currency}
                </span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Credits Added:</span>
                <span className="font-bold text-purple-600 text-2xl">
                  +{transaction.credits_purchased}
                </span>
              </div>

              {userData && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Available Credits:</span>
                  <span className="font-bold text-purple-600 text-2xl">
                    {userData.available_credits}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                <span className="font-mono text-sm text-gray-500">
                  {transaction.id.substring(0, 16)}...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next steps */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3">
            🎉 What&apos;s Next?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Your credits are ready to use! You can now:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-purple-600">☕</span>
              Get a Coffee Cup Reading
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">🃏</span>
              Request a Tarot Reading
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">🎙️</span>
              Have a Voice Call with Baba Mara
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/${locale}/reading`}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-full text-center transition-colors"
          >
            Get Your Reading Now
          </Link>
          <Link
            href={`/${locale}/dashboard`}
            className="flex-1 bg-white dark:bg-gray-800 border-2 border-purple-600 text-purple-600 font-semibold py-4 rounded-full text-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Email confirmation note */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          A confirmation email has been sent to your email address
        </p>
      </div>
    </div>
  )
}
