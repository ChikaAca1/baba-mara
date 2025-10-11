import { setRequestLocale } from 'next-intl/server'
import { getAdminUser } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import UserActions from './actions'

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>
}) {
  const { locale } = await params
  const { page = '1', search = '', filter = 'all' } = await searchParams
  setRequestLocale(locale)

  // Require admin access
  await getAdminUser(locale)

  const supabase = await createClient()
  const pageSize = 20
  const currentPage = parseInt(page) || 1
  const offset = (currentPage - 1) * pageSize

  // Build query
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  // Apply filters
  if (filter === 'subscribed') {
    query = query.eq('subscription_status', 'active')
  } else if (filter === 'guest') {
    query = query.eq('is_guest', true)
  } else if (filter === 'admin') {
    query = query.eq('is_admin', true)
  }

  // Apply search
  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
  }

  const { data: users, count } = await query

  const totalPages = count ? Math.ceil(count / pageSize) : 1

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
                <p className="text-sm text-purple-200">User Management</p>
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
        {/* Header with search */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">User Management</h2>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form className="flex-1 max-w-md">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by email or name..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </form>

            {/* Filters */}
            <div className="flex gap-2">
              <Link
                href={`/${locale}/admin/users?filter=all`}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All
              </Link>
              <Link
                href={`/${locale}/admin/users?filter=subscribed`}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'subscribed'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Subscribed
              </Link>
              <Link
                href={`/${locale}/admin/users?filter=guest`}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'guest'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Guests
              </Link>
              <Link
                href={`/${locale}/admin/users?filter=admin`}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'admin'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Admins
              </Link>
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
          {!users || users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{user.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-purple-600">
                          {user.available_credits}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.subscription_status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}
                        >
                          {user.subscription_status || 'none'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 rounded text-xs font-medium">
                            Admin
                          </span>
                        )}
                        {user.is_guest && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded text-xs font-medium">
                            Guest
                          </span>
                        )}
                        {!user.is_admin && !user.is_guest && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs font-medium">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <UserActions userId={user.id} locale={locale} />
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
                href={`/${locale}/admin/users?page=${currentPage - 1}&search=${search}&filter=${filter}`}
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
                href={`/${locale}/admin/users?page=${currentPage + 1}&search=${search}&filter=${filter}`}
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
