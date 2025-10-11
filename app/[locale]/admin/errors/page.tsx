import { setRequestLocale } from 'next-intl/server'
import { getAdminUser } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function AdminErrorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; severity?: string; type?: string }>
}) {
  const { locale } = await params
  const { page = '1', severity = 'all', type = 'all' } = await searchParams
  setRequestLocale(locale)

  // Require admin access
  await getAdminUser(locale)

  const supabase = await createClient()
  const pageSize = 50
  const currentPage = parseInt(page) || 1
  const offset = (currentPage - 1) * pageSize

  // Build query
  let query = supabase
    .from('error_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  // Apply filters
  if (severity !== 'all') {
    query = query.eq('severity', severity)
  }
  if (type !== 'all') {
    query = query.eq('error_type', type)
  }

  const { data: errors, count } = await query

  const totalPages = count ? Math.ceil(count / pageSize) : 1

  // Get error counts by severity
  const { count: criticalCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'critical')

  const { count: highCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'high')

  // Recent errors (last 24 hours)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { count: recentCount } = await supabase
    .from('error_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday.toISOString())

  // Get unique error types
  const { data: errorTypes } = await supabase
    .from('error_logs')
    .select('error_type')
    .limit(100)

  const uniqueTypes = [...new Set(errorTypes?.map(e => e.error_type) || [])]

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
                <p className="text-sm text-purple-200">Error Monitoring</p>
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
              Total Errors
            </div>
            <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
              {count || 0}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 shadow-md">
            <div className="text-red-600 dark:text-red-400 text-sm mb-2">
              Critical
            </div>
            <div className="text-3xl font-bold text-red-600">
              {criticalCount || 0}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 shadow-md">
            <div className="text-orange-600 dark:text-orange-400 text-sm mb-2">
              High Priority
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {highCount || 0}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 shadow-md">
            <div className="text-yellow-600 dark:text-yellow-400 text-sm mb-2">
              Last 24h
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {recentCount || 0}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <span className="text-sm font-medium py-2">Severity:</span>
            <Link
              href={`/${locale}/admin/errors?severity=all&type=${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                severity === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </Link>
            <Link
              href={`/${locale}/admin/errors?severity=critical&type=${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                severity === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Critical
            </Link>
            <Link
              href={`/${locale}/admin/errors?severity=high&type=${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                severity === 'high'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              High
            </Link>
            <Link
              href={`/${locale}/admin/errors?severity=medium&type=${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                severity === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Medium
            </Link>
            <Link
              href={`/${locale}/admin/errors?severity=low&type=${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                severity === 'low'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Low
            </Link>
          </div>

          {uniqueTypes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm font-medium py-2">Type:</span>
              <Link
                href={`/${locale}/admin/errors?severity=${severity}&type=all`}
                className={`px-3 py-1 rounded text-sm ${
                  type === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All
              </Link>
              {uniqueTypes.slice(0, 10).map((errorType) => (
                <Link
                  key={errorType}
                  href={`/${locale}/admin/errors?severity=${severity}&type=${errorType}`}
                  className={`px-3 py-1 rounded text-sm ${
                    type === errorType
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {errorType}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Errors table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
          {!errors || errors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600 dark:text-gray-400">No errors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Endpoint
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {errors.map((error) => (
                    <tr key={error.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {new Date(error.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-gray-500">
                          {new Date(error.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            error.severity === 'critical'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : error.severity === 'high'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                              : error.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}
                        >
                          {error.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {error.error_type}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm max-w-md truncate">
                        {error.error_message}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">
                        {error.endpoint || '-'}
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
                href={`/${locale}/admin/errors?page=${currentPage - 1}&severity=${severity}&type=${type}`}
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
                href={`/${locale}/admin/errors?page=${currentPage + 1}&severity=${severity}&type=${type}`}
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
