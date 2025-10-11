import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin'

/**
 * Send password reset email (admin only)
 * POST /api/admin/users/reset-password
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
    const { userId }: { userId: string } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(userData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (resetError) {
      throw resetError
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to send reset email' },
      { status: 500 }
    )
  }
}
