import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });

  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const t = await getTranslations('HomePage');
  const tPayment = await getTranslations('Payment');
  const tAuth = await getTranslations('Auth');

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-purple-600">🔮 Baba Mara</div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/auth/signin`}
                className="text-sm font-medium hover:text-purple-600 transition-colors"
              >
                {tAuth('signIn')}
              </Link>
              <Link
                href={`/${locale}/auth/signup`}
                className="rounded-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm px-6 py-2 transition-colors"
              >
                {tAuth('signUp')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t('welcome')}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
            {t('subtitle')}
          </p>
          <div className="flex gap-4 items-center justify-center flex-col sm:flex-row">
            <Link
              href={`/${locale}/auth/signup`}
              className="rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg px-10 py-4 transition-colors shadow-lg hover:shadow-xl"
            >
              {t('cta.start')}
            </Link>
            <Link
              href={`/${locale}/auth/guest`}
              className="rounded-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-semibold text-lg px-10 py-4 transition-colors"
            >
              {t('cta.tryFree')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">{t('features.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Coffee Reading */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">☕</div>
              <h3 className="text-xl font-bold mb-2">{t('features.coffee.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('features.coffee.description')}</p>
            </div>

            {/* Tarot Reading */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🃏</div>
              <h3 className="text-xl font-bold mb-2">{t('features.tarot.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('features.tarot.description')}</p>
            </div>

            {/* Voice Interaction */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎙️</div>
              <h3 className="text-xl font-bold mb-2">{t('features.voice.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('features.voice.description')}</p>
            </div>

            {/* Multilingual */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-2">{t('features.multilingual.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('features.multilingual.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">{t('pricing.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Single Reading */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md border-2 border-gray-200 dark:border-gray-700 hover:border-purple-600 transition-colors">
              <h3 className="text-2xl font-bold mb-2">{tPayment('singleReading')}</h3>
              <div className="text-4xl font-bold text-purple-600 mb-4">{tPayment('singleReadingPrice')}</div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{tPayment('singleReadingDesc')}</p>
            </div>

            {/* Subscription */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 shadow-xl transform scale-105">
              <div className="bg-white dark:bg-gray-900 rounded-lg px-3 py-1 inline-block mb-4 text-sm font-semibold">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">{tPayment('subscription')}</h3>
              <div className="text-4xl font-bold text-white mb-4">{tPayment('subscriptionPrice')}</div>
              <p className="text-purple-100 mb-6">{tPayment('subscriptionDesc')}</p>
            </div>

            {/* Top-Up */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md border-2 border-gray-200 dark:border-gray-700 hover:border-purple-600 transition-colors">
              <h3 className="text-2xl font-bold mb-2">{tPayment('topUp')}</h3>
              <div className="text-4xl font-bold text-purple-600 mb-4">{tPayment('topUpPrice')}</div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{tPayment('topUpDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-purple-50 dark:bg-purple-900/20 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            ℹ️ {t('disclaimer')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400 text-sm">
          © 2025 Baba Mara. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
