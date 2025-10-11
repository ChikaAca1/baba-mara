'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Locale } from '@/lib/supabase/types'

export interface AuthResult {
  success: boolean
  error?: string
  message?: string
}

// ============================================================================
// SIGN UP
// ============================================================================

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  locale: Locale
): Promise<AuthResult> {
  const supabase = await createClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        locale,
      },
    },
  })

  if (authError) {
    return {
      success: false,
      error: authError.message,
    }
  }

  if (!authData.user) {
    return {
      success: false,
      error: 'Failed to create user account',
    }
  }

  // Create user profile in public.users table
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email: authData.user.email!,
    full_name: fullName,
    locale,
    available_credits: 0, // Start with 0 credits
    total_credits_purchased: 0,
    is_guest: false,
    is_admin: false,
  })

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    return {
      success: false,
      error: 'Failed to create user profile',
    }
  }

  return {
    success: true,
    message: 'Account created successfully! Please check your email to verify your account.',
  }
}

// ============================================================================
// SIGN IN
// ============================================================================

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Signed in successfully',
  }
}

// ============================================================================
// SIGN OUT
// ============================================================================

export async function signOut(): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Signed out successfully',
  }
}

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

export async function signInWithGoogle(locale: Locale): Promise<never> {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    redirect(`/${locale}/auth/signin?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    redirect(data.url)
  }

  // This should never be reached
  redirect(`/${locale}/auth/signin`)
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export async function resetPasswordRequest(email: string, locale: Locale): Promise<AuthResult> {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/${locale}/auth/reset-password`,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Password reset email sent. Please check your inbox.',
  }
}

export async function resetPassword(newPassword: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Password updated successfully',
  }
}

// ============================================================================
// GET CURRENT USER
// ============================================================================

export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// ============================================================================
// CHECK IF USER IS ADMIN
// ============================================================================

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.is_admin || false
}
