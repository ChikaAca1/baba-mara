import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReadingType, Locale } from '@/lib/supabase/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const {
      reading_type,
      question,
      locale,
      is_voice_session = false,
      livekit_room_name
    }: {
      reading_type: ReadingType
      question: string
      locale: Locale
      is_voice_session?: boolean
      livekit_room_name?: string
    } = body

    // Validate input
    if (!reading_type || !question || !locale) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['coffee', 'tarot'].includes(reading_type)) {
      return NextResponse.json({ error: 'Invalid reading type' }, { status: 400 })
    }

    if (!is_voice_session && question.length > 500) {
      return NextResponse.json({ error: 'Question too long' }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('available_credits, is_guest')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has credits
    if (profile.available_credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue.' },
        { status: 403 }
      )
    }

    // Deduct credits using database function
    const { data: creditDeducted, error: deductError } = await supabase.rpc('deduct_user_credits', {
      p_user_id: user.id,
      p_credits: 1,
    })

    if (deductError || !creditDeducted) {
      return NextResponse.json(
        { error: 'Failed to deduct credits. Please try again.' },
        { status: 500 }
      )
    }

    // Get client IP and user agent for tracking
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create reading record
    const { data: reading, error: readingError } = await supabase
      .from('readings')
      .insert({
        user_id: user.id,
        reading_type,
        question,
        locale,
        status: 'pending',
        credits_used: 1,
        was_free_trial: profile.is_guest && profile.available_credits === 0, // First reading for guest
        ip_address: ip,
        user_agent: userAgent,
        is_voice_session,
        livekit_room_name: is_voice_session ? (livekit_room_name || `voice-${user.id}-${Date.now()}`) : null,
      })
      .select()
      .single()

    if (readingError || !reading) {
      // Rollback: add credit back
      await supabase.rpc('add_user_credits', {
        p_user_id: user.id,
        p_credits: 1,
      })

      return NextResponse.json({ error: 'Failed to create reading' }, { status: 500 })
    }

    // Trigger AI reading generation in background
    // Note: In production, use a proper job queue (e.g., Vercel Cron, Inngest, etc.)
    // For now, we'll trigger it immediately after creation

    // Start processing asynchronously (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/readings/process/${reading.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((err) => {
      console.error('Failed to trigger reading processing:', err)
    })

    return NextResponse.json({
      success: true,
      reading,
      message: 'Reading created successfully. Processing has started.',
    })
  } catch (error) {
    console.error('Error creating reading:', error)

    // Log error to database
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      await supabase.from('error_logs').insert({
        user_id: user?.id || null,
        error_type: 'reading_creation_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_stack: error instanceof Error ? error.stack : null,
        endpoint: '/api/readings/create',
        severity: 'high',
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
