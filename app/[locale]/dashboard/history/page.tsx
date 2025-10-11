import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function ReadingHistoryPage({
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

  // Get all user's readings
  const supabase = await createClient()
  const { data: readings } = await supabase
    .from('readings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('readingHistory')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            All your readings with Baba Mara
          </p>
        </div>

        {/* Readings List */}
        {!readings || readings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-md text-center">
            <div className="text-6xl mb-4">🔮</div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('noReadings')}
            </p>
            <Link
              href={`/${locale}/reading`}
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-3 rounded-full transition-colors"
            >
              {t('getReading')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {readings.map((reading) => (
              <div
                key={reading.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">
                        {reading.reading_type === 'coffee' ? '☕' : '🃏'}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold capitalize">
                          {reading.reading_type} Reading
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
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
                          {reading.was_free_trial && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              Free Trial
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Question: </span>
                        {reading.question}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        📅 {new Date(reading.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        🕐 {new Date(reading.created_at).toLocaleTimeString()}
                      </span>
                      {reading.livekit_session_duration && (
                        <span>
                          🎙️ {Math.floor(reading.livekit_session_duration / 60)}m{' '}
                          {reading.livekit_session_duration % 60}s
                        </span>
                      )}
                    </div>
                  </div>

                  {reading.status === 'completed' && (
                    <Link
                      href={`/${locale}/dashboard/reading/${reading.id}`}
                      className="ml-4 bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-full transition-colors"
                    >
                      View Reading
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {readings && readings.length > 0 && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {readings.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Readings</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {readings.filter((r) => r.reading_type === 'coffee').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Coffee Readings</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {readings.filter((r) => r.reading_type === 'tarot').length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Tarot Readings</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
