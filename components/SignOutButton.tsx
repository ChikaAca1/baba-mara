'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

export default function SignOutButton({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setLoading(true)
    const result = await signOut()

    if (result.success) {
      router.push(`/${locale}`)
      router.refresh()
    } else {
      setLoading(false)
      alert(result.error || 'Sign out failed')
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
