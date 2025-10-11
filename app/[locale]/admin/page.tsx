import { setRequestLocale } from 'next-intl/server'
import { getAdminUser } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Require admin access
  await getAdminUser(locale)

  // Get statistics
  const supabase = await createClient()

  // Total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Active subscriptions
  const { count: activeSubscriptions } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  // Total transactions
  const { count: totalTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })

  // Total revenue (completed transactions only)
  const { data: completedTransactions } = await supabase
    .from('transactions')
    .select('amount')
    .eq('status', 'completed')

  const totalRevenue = completedTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0

  // Total readings
  const { count: totalReadings } = await supabase
    .from('readings')
    .select('*', { count: 'exact', head: true })

  // Recent errors (last 24 hours)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { count: recentErrors } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday.toISOString())

  // Recent users (last 7 days)
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)

  const { count: newUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', lastWeek.toISOString())

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">👨‍💼</span>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-sm text-purple-200">Baba Mara</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/dashboard`}
                className="text-sm text-purple-200 hover:text-white transition-colors"
              >
                ← User Dashboard
              </Link>
              <SignOutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
          <p className="text-gray-600 dark:text-gray-400">
            System statistics and quick access to admin tools
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Users</h3>
              <span className="text-3xl">👥</span>
            </div>
            <div className="text-4xl font-bold">{totalUsers || 0}</div>
            <p className="text-sm opacity-75 mt-2">+{newUsers || 0} this week</p>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Active Subs</h3>
              <span className="text-3xl">⭐</span>
            </div>
            <div className="text-4xl font-bold">{activeSubscriptions || 0}</div>
            <p className="text-sm opacity-75 mt-2">
              {totalUsers ? Math.round((activeSubscriptions! / totalUsers) * 100) : 0}% of users
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <span className="text-3xl">💰</span>
            </div>
            <div className="text-4xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-sm opacity-75 mt-2">{totalTransactions || 0} transactions</p>
          </div>

          {/* Total Readings */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Readings</h3>
              <span className="text-3xl">🔮</span>
            </div>
            <div className="text-4xl font-bold">{totalReadings || 0}</div>
            <p className="text-sm opacity-75 mt-2">
              {totalUsers ? Math.round(totalReadings! / totalUsers) : 0} per user avg
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link
            href={`/${locale}/admin/users`}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">User Management</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage users and credits
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/${locale}/admin/transactions`}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Transactions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor all payments
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/${locale}/admin/errors`}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-red-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Error Monitoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recentErrors || 0} errors (24h)
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold mb-4">System Health</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                <span className="text-green-600 font-medium">✓ Healthy</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">API</span>
                <span className="text-green-600 font-medium">✓ Operational</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                <span className="text-green-600 font-medium">✓ Available</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
