'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReadingStatus } from '@/hooks/useReadingStatus'
import type { Reading } from '@/lib/supabase/types'
import Link from 'next/link'

interface ClientWrapperProps {
  initialReading: Reading
  locale: string
}

export default function ReadingClientWrapper({ initialReading, locale }: ClientWrapperProps) {
  const router = useRouter()
  const [reading, setReading] = useState<Reading>(initialReading)

  const { status, reading: updatedReading, isPolling } = useReadingStatus({
    readingId: initialReading.id,
    initialStatus: initialReading.status,
    onComplete: (completedReading) => {
      // Update local state with completed reading
      setReading((prev) => ({ ...prev, ...completedReading }))
      // Refresh the page to get server-side data
      router.refresh()
    },
    onError: (error) => {
      console.error('Reading failed:', error)
      router.refresh()
    },
  })

  // Update reading when polling data changes
  useEffect(() => {
    if (updatedReading) {
      setReading((prev) => ({ ...prev, ...updatedReading }))
    }
  }, [updatedReading])

  return (
    <>
      {/* Reading Status-specific Content */}
      {(status === 'pending' || status === 'processing') && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-8 text-center">
          <div className="relative inline-block">
            {/* Animated crystal ball */}
            <div className="text-8xl mb-4 animate-pulse">🔮</div>
            {isPolling && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {status === 'pending' ? 'Preparing Your Reading...' : 'Baba Mara is Reading Your Fortune...'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {status === 'pending'
              ? 'Your reading will begin shortly. Please wait...'
              : 'The spirits are being consulted. This may take a moment...'}
          </p>
          {isPolling && (
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium animate-pulse">
              ✨ Processing... Please do not close this page
            </p>
          )}
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Reading Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {reading.error_message || 'Something went wrong while processing your reading.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={`/${locale}/reading`}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-full transition-colors"
            >
              Try Again
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium px-6 py-2 rounded-full transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {status === 'completed' && reading.response_text && (
        <>
          {/* Response Text */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4">Baba Mara&apos;s Reading</h2>
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {reading.response_text}
              </div>
            </div>
          </div>

          {/* Audio Response (if available) */}
          {reading.response_audio_url && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md mb-6">
              <h3 className="text-xl font-bold mb-4">🎙️ Listen to Your Reading</h3>
              <audio controls className="w-full">
                <source src={reading.response_audio_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href={`/${locale}/reading`}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-3 rounded-full transition-colors shadow-lg hover:shadow-xl"
            >
              Get Another Reading
            </Link>
            <Link
              href={`/${locale}/dashboard/history`}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium px-8 py-3 rounded-full transition-colors"
            >
              View All Readings
            </Link>
          </div>
        </>
      )}
    </>
  )
}
