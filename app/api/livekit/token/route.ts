import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLiveKitToken, getLiveKitUrl } from '@/lib/livekit/server'

/**
 * Generate LiveKit access token for authenticated user
 * POST /api/livekit/token
 * Body: { roomName: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get room name from request
    const { roomName } = await request.json()

    if (!roomName || typeof roomName !== 'string') {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
    }

    // Generate token
    const token = await generateLiveKitToken(roomName, user.id)
    const url = getLiveKitUrl()

    return NextResponse.json({
      success: true,
      token,
      url,
    })
  } catch (error) {
    console.error('LiveKit token generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
