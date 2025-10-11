import { useState, useEffect, useCallback } from 'react'
import type { Reading } from '@/lib/supabase/types'

interface UseReadingStatusOptions {
  readingId: string
  initialStatus?: string
  onComplete?: (reading: Partial<Reading>) => void
  onError?: (error: string) => void
  pollingInterval?: number // in milliseconds
}

export function useReadingStatus({
  readingId,
  initialStatus = 'pending',
  onComplete,
  onError,
  pollingInterval = 3000, // Poll every 3 seconds
}: UseReadingStatusOptions) {
  const [status, setStatus] = useState<string>(initialStatus)
  const [reading, setReading] = useState<Partial<Reading> | null>(null)
  const [isPolling, setIsPolling] = useState(initialStatus === 'pending' || initialStatus === 'processing')

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/readings/status/${readingId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch reading status')
      }

      const data = await response.json()

      if (data.success && data.reading) {
        setStatus(data.reading.status)
        setReading(data.reading)

        // Stop polling if completed or failed
        if (data.reading.status === 'completed') {
          setIsPolling(false)
          onComplete?.(data.reading)
        } else if (data.reading.status === 'failed') {
          setIsPolling(false)
          onError?.(data.reading.error_message || 'Reading failed')
        }
      }
    } catch (error) {
      console.error('Error checking reading status:', error)
      onError?.(error instanceof Error ? error.message : 'Unknown error')
      setIsPolling(false)
    }
  }, [readingId, onComplete, onError])

  useEffect(() => {
    if (!isPolling) return

    // Check immediately
    checkStatus()

    // Set up polling interval
    const interval = setInterval(checkStatus, pollingInterval)

    return () => clearInterval(interval)
  }, [isPolling, checkStatus, pollingInterval])

  return {
    status,
    reading,
    isPolling,
    checkStatus,
    stopPolling: () => setIsPolling(false),
  }
}
