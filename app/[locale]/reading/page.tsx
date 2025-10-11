'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { Locale, ReadingType } from '@/lib/supabase/types'

export default function ReadingPage() {
  const t = useTranslations('Reading')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale

  const [readingType, setReadingType] = useState<ReadingType>('coffee')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!question.trim()) {
      setError('Please enter a question')
      setLoading(false)
      return
    }

    try {
      // Create reading request
      const response = await fetch('/api/readings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reading_type: readingType,
          question: question.trim(),
          locale,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create reading')
      }

      const data = await response.json()

      // Redirect to reading result page
      router.push(`/${locale}/dashboard/reading/${data.reading.id}`)
    } catch (err) {
      console.error('Error creating reading:', err)
      setError(err instanceof Error ? err.message : 'Failed to create reading')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/dashboard`} className="text-2xl font-bold text-purple-600">
              🔮 Baba Mara
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('askQuestion')}
          </p>
        </div>

        {/* Reading Type Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Choose Reading Type</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Coffee Reading */}
            <button
              onClick={() => setReadingType('coffee')}
              className={`p-6 rounded-lg border-2 transition-all ${
                readingType === 'coffee'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="text-5xl mb-3">☕</div>
              <h3 className="text-lg font-bold mb-2">Coffee Cup Reading</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Traditional Turkish coffee fortune telling
              </p>
            </button>

            {/* Tarot Reading */}
            <button
              onClick={() => setReadingType('tarot')}
              className={`p-6 rounded-lg border-2 transition-all ${
                readingType === 'tarot'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="text-5xl mb-3">🃏</div>
              <h3 className="text-lg font-bold mb-2">Tarot Reading</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ancient wisdom through tarot cards
              </p>
            </button>
          </div>
        </div>

        {/* Question Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="question" className="block text-lg font-medium mb-2">
              Your Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('questionPlaceholder')}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
              required
              maxLength={500}
            />
            <div className="mt-2 text-sm text-gray-500 text-right">
              {question.length}/500 characters
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
          >
            {loading ? t('processing') : t('submit')}
          </button>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm text-purple-900 dark:text-purple-300">
              ℹ️ {t('disclaimer')}
            </p>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-3">💡 Tips for Better Readings</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Be specific with your question</li>
            <li>• Focus on what you truly want to know</li>
            <li>• Keep an open mind to the guidance</li>
            <li>• Remember this is for entertainment and reflection</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
