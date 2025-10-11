import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function TransactionsPage({
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

  // Get all transactions for user
  const supabase = await createClient()
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate totals
  const totalSpent = transactions
    ?.filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const totalCredits = transactions
    ?.filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.credits_purchased, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/dashboard`} className="text-2xl font-bold text-purple-600">
              🔮 Baba Mara
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/dashboard`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <SignOutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">💳 Transaction History</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your payment transactions and credit purchases
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Total Transactions
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {transactions?.length || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Total Spent
            </div>
            <div className="text-3xl font-bold text-purple-600">
              ${totalSpent.toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Total Credits Purchased
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {totalCredits}
            </div>
          </div>
        </div>

        {/* Transactions table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold">All Transactions</h2>
          </div>

          {!transactions || transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💳</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No transactions yet
              </p>
              <Link
                href={`/${locale}/payment`}
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-full transition-colors"
              >
                Buy Credits
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-gray-500 text-xs">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium capitalize">
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        ${transaction.amount.toFixed(2)} {transaction.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                        +{transaction.credits_purchased}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : transaction.status === 'refunded'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href={`/${locale}/dashboard`}
            className="text-purple-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href={`/${locale}/payment`}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-full transition-colors"
          >
            Buy More Credits
          </Link>
        </div>
      </div>
    </div>
  )
}
