import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import PaymentPlans from './plans'

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Payment')

  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/auth/signin`)
  }

  // Get user data
  const supabase = await createClient()
  const { data: userData } = await supabase
    .from('users')
    .select('available_credits, subscription_status, is_guest')
    .eq('id', user.id)
    .single()

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
                <span className="text-gray-600 dark:text-gray-400">Credits: </span>
                <span className="font-bold text-purple-600">
                  {userData?.available_credits || 0}
                </span>
              </div>
              <SignOutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            💳 {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Get credits for mystical readings with Baba Mara
          </p>
        </div>

        {/* Guest warning */}
        {userData?.is_guest && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">
                  Guest Mode - Create Account Required
                </h3>
                <p className="text-yellow-800 dark:text-yellow-400 mb-3">
                  You must create a permanent account to purchase credits. Guest accounts cannot make purchases.
                </p>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Account Now
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pricing plans */}
        {!userData?.is_guest && (
          <PaymentPlans
            locale={locale}
            currentSubscription={userData?.subscription_status}
          />
        )}

        {/* Features */}
        <div className="mt-16 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-center mb-6">
            What You Get with Your Credits
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">☕</div>
              <h4 className="font-bold mb-2">Coffee Cup Reading</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Traditional Turkish coffee fortune telling
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🃏</div>
              <h4 className="font-bold mb-2">Tarot Reading</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ancient tarot wisdom and guidance
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎙️</div>
              <h4 className="font-bold mb-2">Voice Reading</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time voice conversation with Baba Mara
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-bold mb-2">How do credits work?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Each reading (coffee, tarot, or voice) costs 1 credit. Credits never expire and can be used anytime.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-bold mb-2">Can I cancel my subscription?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yes, you can cancel anytime from your dashboard. You&apos;ll keep your remaining credits even after cancellation.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-bold mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We accept all major credit cards, debit cards, and local payment methods through our secure payment processor.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-bold mb-2">Is my payment information secure?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yes, all payments are processed securely through Payten. We never store your payment information.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            ℹ️ These readings are generated by an AI-based digital advisor and are intended
            solely for entertainment and introspective purposes. They are not professional advice.
          </p>
        </div>
      </div>
    </div>
  )
}
