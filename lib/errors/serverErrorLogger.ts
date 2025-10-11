import { createClient } from '@/lib/supabase/server'
import type { ErrorLogData } from './errorHandler'

/**
 * Log error to database (SERVER ONLY)
 * Used in API routes and server components
 */
export async function logError(data: ErrorLogData): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('error_logs').insert({
      ...data,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    // Fallback to console if database logging fails
    console.error('Failed to log error to database:', error)
    console.error('Original error:', data)
  }
}
