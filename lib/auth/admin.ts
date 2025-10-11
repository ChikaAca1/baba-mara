import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Check if user is admin
 * Returns true if user has admin role, false otherwise
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return false
  }

  return user.is_admin === true
}

/**
 * Require admin access
 * Redirects to unauthorized page if user is not admin
 */
export async function requireAdmin(locale: string = 'en'): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${locale}/auth/signin`)
  }

  const isAdmin = await isUserAdmin(user.id)

  if (!isAdmin) {
    redirect(`/${locale}/unauthorized`)
  }
}

/**
 * Get admin user or redirect
 * Returns user object if admin, redirects otherwise
 */
export async function getAdminUser(locale: string = 'en') {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/${locale}/auth/signin`)
  }

  const isAdmin = await isUserAdmin(user.id)

  if (!isAdmin) {
    redirect(`/${locale}/unauthorized`)
  }

  // Get full user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    redirect(`/${locale}/auth/signin`)
  }

  return userData
}
