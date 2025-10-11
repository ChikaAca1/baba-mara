import { setRequestLocale } from 'next-intl/server'
import { getAdminUser } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function AdminTransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { locale } = await params
  const { page = '1', status = 'all' } = await searchParams
  setRequestLocale(locale)

  // Require admin access
  await getAdminUser(locale)

  const supabase = await createClient()
  const pageSize = 30
  const currentPage = parseInt(page) || 1
  const offset = (currentPage - 1) * pageSize

  // Build query
  let query = supabase
    .from('transactions')
    .select('*, users(email, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: transactions, count } = await query

  const totalPages = count ? Math.ceil(count / pageSize) : 1

  // Calculate totals
  const { data: completedTransactions } = await supabase
    .from('transactions')
    .select('amount')
    .eq('status', 'completed')

  const totalRevenue = completedTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0

  const { count: pendingCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: failedCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/admin`} className="flex items-center gap-2">
              <span className="text-3xl">👨‍💼</span>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-sm text-purple-200">Transaction Monitoring</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/admin`}
                className="text-sm text-purple-200 hover:text-white transition-colors"
              >
                ← Dashboard
              </Link>
              <SignOutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Summary cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Total Revenue
            </div>
            <div className="text-3xl font-bold text-green-600">
              ${totalRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Total Transactions
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {count || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Pending
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {pendingCount || 0}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Failed
            </div>
            <div className="text-3xl font-bold text-red-600">
              {failedCount || 0}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <Link
            href={`/${locale}/admin/transactions?status=all`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All
          </Link>
          <Link
            href={`/${locale}/admin/transactions?status=completed`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'completed'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Completed
          </Link>
          <Link
            href={`/${locale}/admin/transactions?status=pending`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Pending
          </Link>
          <Link
            href={`/${locale}/admin/transactions?status=failed`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'failed'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Failed
          </Link>
          <Link
            href={`/${locale}/admin/transactions?status=refunded`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'refunded'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Refunded
          </Link>
        </div>

        {/* Transactions table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
          {!transactions || transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💳</div>
              <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Payment ID
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
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium">
                            {transaction.users?.full_name || 'N/A'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {transaction.users?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">
                        {transaction.transaction_type}
                      </td>
                      <td className="px-6 py-4 font-bold text-sm">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-bold text-purple-600">
                        +{transaction.credits_purchased}
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">
                        {transaction.payment_id ?
                          transaction.payment_id.substring(0, 20) + '...' :
                          '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/${locale}/admin/transactions?page=${currentPage - 1}&status=${status}`}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ← Previous
              </Link>
            )}
            <span className="px-4 py-2 bg-purple-600 text-white rounded-lg">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/${locale}/admin/transactions?page=${currentPage + 1}&status=${status}`}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
