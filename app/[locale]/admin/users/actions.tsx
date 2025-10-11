'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserActionsProps {
  userId: string
  locale: string
}

export default function UserActions({ userId, locale }: UserActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  const handleAddCredits = async () => {
    const credits = prompt('Enter number of credits to add:')
    if (!credits || isNaN(parseInt(credits))) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/users/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credits: parseInt(credits) }),
      })

      if (!response.ok) {
        throw new Error('Failed to add credits')
      }

      alert(`Successfully added ${credits} credits`)
      router.refresh()
    } catch {
      alert('Failed to add credits')
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm('Send password reset email to this user?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to send reset email')
      }

      alert('Password reset email sent')
    } catch {
      alert('Failed to send reset email')
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
      >
        {loading ? 'Loading...' : 'Actions'}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <button
              onClick={handleAddCredits}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
            >
              Add Credits
            </button>
            <button
              onClick={handleResetPassword}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Reset Password
            </button>
            <Link
              href={`/${locale}/admin/users/${userId}`}
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
            >
              View Details
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
