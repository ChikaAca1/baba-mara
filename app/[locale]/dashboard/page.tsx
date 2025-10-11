import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage({
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

  const t = await getTranslations('Dashboard')
  const tReading = await getTranslations('Reading')

  // Get user's recent readings
  const supabase = await createClient()
  const { data: readings } = await supabase
    .from('readings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}`} className="text-2xl font-bold text-purple-600">
              🔮 Baba Mara
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/dashboard/transactions`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors"
              >
                💳 Transactions
              </Link>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.full_name || user.email}
              </span>
              <SignOutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user.full_name || 'friend'}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Available Credits */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {t('remainingReadings')}
              </h3>
              <div className="text-2xl">💳</div>
            </div>
            <div className="text-4xl font-bold text-purple-600">
              {user.available_credits}
            </div>
            {user.available_credits === 0 && (
              <Link
                href={`/${locale}/payment`}
                className="mt-4 block text-sm text-purple-600 hover:underline"
              >
                Buy more credits →
              </Link>
            )}
          </div>

          {/* Subscription Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Subscription
              </h3>
              <div className="text-2xl">📅</div>
            </div>
            {user.subscription_status === 'active' ? (
              <>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Renews{' '}
                  {user.subscription_renews_at
                    ? new Date(user.subscription_renews_at).toLocaleDateString()
                    : 'soon'}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">No Subscription</div>
                <Link
                  href={`/${locale}/payment`}
                  className="mt-2 block text-sm text-purple-600 hover:underline"
                >
                  Subscribe now →
                </Link>
              </>
            )}
          </div>

          {/* Total Readings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Total Readings
              </h3>
              <div className="text-2xl">🔮</div>
            </div>
            <div className="text-4xl font-bold text-purple-600">
              {readings?.length || 0}
            </div>
          </div>
        </div>

        {/* Ask New Question CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 mb-12 text-center shadow-xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('askNewQuestion')}
          </h2>
          <p className="text-purple-100 mb-6">
            {tReading('askQuestion')}
          </p>
          {user.available_credits > 0 ? (
            <div className="flex items-center justify-center gap-4">
              <Link
                href={`/${locale}/reading`}
                className="inline-flex items-center gap-2 bg-white text-purple-600 font-semibold px-8 py-3 rounded-full hover:bg-purple-50 transition-colors"
              >
                <span>📝</span>
                Text Reading
              </Link>
              <Link
                href={`/${locale}/voice`}
                className="inline-flex items-center gap-2 bg-purple-800 text-white font-semibold px-8 py-3 rounded-full hover:bg-purple-900 transition-colors border-2 border-white"
              >
                <span>🎙️</span>
                Voice Reading
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-white mb-4 font-medium">
                You don&apos;t have any credits remaining
              </p>
              <Link
                href={`/${locale}/payment`}
                className="inline-block bg-white text-purple-600 font-semibold px-8 py-3 rounded-full hover:bg-purple-50 transition-colors"
              >
                Buy Credits
              </Link>
            </div>
          )}
        </div>

        {/* Reading History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('readingHistory')}</h2>
            {readings && readings.length > 0 && (
              <Link
                href={`/${locale}/dashboard/history`}
                className="text-sm text-purple-600 hover:underline"
              >
                View all →
              </Link>
            )}
          </div>

          {!readings || readings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔮</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('noReadings')}
              </p>
              <Link
                href={`/${locale}/reading`}
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-full transition-colors"
              >
                {t('getReading')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {readings.map((reading) => (
                <div
                  key={reading.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {reading.reading_type === 'coffee' ? '☕' : '🃏'}
                        </span>
                        <span className="font-medium capitalize">
                          {reading.reading_type} Reading
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            reading.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : reading.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : reading.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}
                        >
                          {reading.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {reading.question}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(reading.created_at).toLocaleDateString()}{' '}
                        {new Date(reading.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {reading.status === 'completed' && (
                      <Link
                        href={`/${locale}/dashboard/reading/${reading.id}`}
                        className="text-purple-600 hover:underline text-sm font-medium"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guest User Notice */}
        {user.is_guest && (
          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-bold mb-2">You&apos;re using Guest Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Your session will expire in 24 hours. Create an account to save your
                  readings and get unlimited access!
                </p>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm px-6 py-2 rounded-full transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
