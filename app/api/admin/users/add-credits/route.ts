import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin'

/**
 * Add credits to user account (admin only)
 * POST /api/admin/users/add-credits
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Authenticate admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !(await isUserAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const { userId, credits }: { userId: string; credits: number } = await request.json()

    if (!userId || !credits || credits <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Add credits using database function
    const { error } = await supabase.rpc('add_user_credits', {
      p_user_id: userId,
      p_credits: credits,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, message: `Added ${credits} credits` })
  } catch (error) {
    console.error('Add credits error:', error)
    return NextResponse.json(
      { error: 'Failed to add credits' },
      { status: 500 }
    )
  }
}
