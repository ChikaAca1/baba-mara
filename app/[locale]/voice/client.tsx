'use client'

import { useState } from 'react'
import VoiceCall from '@/components/VoiceCall'
import { useRouter } from 'next/navigation'

interface VoiceReadingClientProps {
  locale: string
  userId: string
  hasCredits: boolean
}

export default function VoiceReadingClient({
  locale,
  userId,
  hasCredits,
}: VoiceReadingClientProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [readingId, setReadingId] = useState<string | null>(null)
  const [readingType, setReadingType] = useState<'coffee' | 'tarot'>('coffee')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCallStart = async () => {
    try {
      setError(null)

      // Create reading session
      const response = await fetch('/api/readings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading_type: readingType,
          question: 'Voice reading session',
          locale: locale,
          is_voice_session: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start session')
      }

      const { reading } = await response.json()
      setReadingId(reading.id)
      setIsCallActive(true)
    } catch (err) {
      console.error('Failed to start call:', err)
      setError(err instanceof Error ? err.message : 'Failed to start call')
    }
  }

  const handleCallEnd = () => {
    setIsCallActive(false)

    // Redirect to reading detail if reading was created
    if (readingId) {
      router.push(`/${locale}/dashboard/reading/${readingId}`)
    }
  }

  const handleError = (err: Error) => {
    console.error('Call error:', err)
    setError(err.message)
    setIsCallActive(false)
  }

  return (
    <div className="space-y-6">
      {/* Reading type selector */}
      {!isCallActive && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="font-bold text-lg mb-4">Select Reading Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setReadingType('coffee')}
              className={`p-6 rounded-lg border-2 transition-all ${
                readingType === 'coffee'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="text-4xl mb-2">☕</div>
              <div className="font-bold">Coffee Cup</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Traditional Tasseography
              </div>
            </button>

            <button
              onClick={() => setReadingType('tarot')}
              className={`p-6 rounded-lg border-2 transition-all ${
                readingType === 'tarot'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="text-4xl mb-2">🃏</div>
              <div className="font-bold">Tarot Reading</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ancient Card Wisdom
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400">❌</span>
            <span className="text-red-800 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Voice call component */}
      {hasCredits && (
        <VoiceCall
          roomName={readingId || `voice-${userId}-${Date.now()}`}
          onCallStart={handleCallStart}
          onCallEnd={handleCallEnd}
          onError={handleError}
        />
      )}
    </div>
  )
}
