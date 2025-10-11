import { NextResponse } from 'next/server'
import { logError } from '@/lib/errors/serverErrorLogger'

/**
 * Log client-side errors to database
 * POST /api/log-error
 */
export async function POST(request: Request) {
  try {
    // Get error details from request
    const {
      error_type,
      error_message,
      stack_trace,
      severity = 'medium',
      endpoint,
    }: {
      error_type: string
      error_message: string
      stack_trace?: string
      severity?: 'low' | 'medium' | 'high' | 'critical'
      endpoint?: string
    } = await request.json()

    // Validate required fields
    if (!error_type || !error_message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log error to database
    await logError({
      error_type,
      error_message,
      stack_trace,
      severity,
      endpoint,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging endpoint failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
