import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import VoiceReadingClient from './client'

export default async function VoiceReadingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('VoiceReading')

  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/auth/signin`)
  }

  // Get user data
  const supabase = await createClient()
  const { data: userData } = await supabase
    .from('users')
    .select('available_credits, is_guest, subscription_status')
    .eq('id', user.id)
    .single()

  // Check if user has credits
  const hasCredits = (userData?.available_credits || 0) > 0

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
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('credits')}: </span>
                <span className="font-bold text-purple-600">
                  {userData?.available_credits || 0}
                </span>
              </div>
              <SignOutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            🎙️ {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('subtitle')}
          </p>
        </div>

        {/* No credits warning */}
        {!hasCredits && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">
                  {t('noCredits.title')}
                </h3>
                <p className="text-yellow-800 dark:text-yellow-400 mb-3">
                  {t('noCredits.message')}
                </p>
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('noCredits.action')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Guest mode warning */}
        {userData?.is_guest && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">ℹ️</span>
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                  {t('guestWarning.title')}
                </h3>
                <p className="text-blue-800 dark:text-blue-400 mb-3">
                  {t('guestWarning.message')}
                </p>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('guestWarning.action')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Voice reading interface */}
        <VoiceReadingClient
          locale={locale}
          userId={user.id}
          hasCredits={hasCredits}
        />

        {/* Instructions */}
        <div className="mt-8 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3">
            📖 {t('instructions.title')}
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>{t('instructions.step1')}</li>
            <li>{t('instructions.step2')}</li>
            <li>{t('instructions.step3')}</li>
            <li>{t('instructions.step4')}</li>
            <li>{t('instructions.step5')}</li>
          </ol>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            ℹ️ {t('disclaimer')}
          </p>
        </div>
      </div>
    </div>
  )
}
