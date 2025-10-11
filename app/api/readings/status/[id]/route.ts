import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get reading status
    const { data: reading, error } = await supabase
      .from('readings')
      .select('id, status, reading_type, response_text, response_audio_url, error_message, completed_at')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this reading
      .single()

    if (error || !reading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      reading,
    })
  } catch (error) {
    console.error('Error fetching reading status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading status' },
      { status: 500 }
    )
  }
}
