"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

function JoinGroupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('code')

  const [joining, setJoining] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link')
    }
  }, [inviteCode])

  const handleJoin = async () => {
    if (!inviteCode) return

    setJoining(true)

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      })

      if (response.status === 401) {
        // User not logged in - redirect to signup with return URL
        const returnUrl = `/groups/join?code=${inviteCode}`
        router.push(`/auth/signup?returnUrl=${encodeURIComponent(returnUrl)}`)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to join group')
      }

      const { group, alreadyMember } = await response.json()

      if (alreadyMember) {
        toast.success(`You're already in ${group.name}`)
      } else {
        toast.success(`Joined ${group.name}!`)
      }

      router.push('/groups')
    } catch (error) {
      console.error('Failed to join group:', error)
      setError('Failed to join group. Please try again.')
      toast.error('Failed to join group')
    } finally {
      setJoining(false)
    }
  }

  if (!inviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Invite Link</h1>
          <p className="text-gray-600 mb-6">
            This invite link appears to be invalid or incomplete.
          </p>
          <Button onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-2xl font-bold mb-2">Join Group Chat</h1>
          <p className="text-gray-600">
            You've been invited to join a group with oStaran AI!
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium mb-2">
              What happens next:
            </p>
            <ul className="text-xs text-blue-700 text-left space-y-1 ml-4">
              <li>• Join the group conversation</li>
              <li>• Chat with other members</li>
              <li>• Get help from oStaran AI</li>
              <li>• oStaran monitors and assists when needed</li>
            </ul>
          </div>
        )}

        <Button
          onClick={handleJoin}
          disabled={joining || !!error}
          className="w-full"
          size="lg"
        >
          {joining ? 'Joining...' : 'Join Group'}
        </Button>

        <p className="text-xs text-gray-500 mt-4">
          By joining, you'll be able to chat with group members and oStaran AI
        </p>
      </div>
    </div>
  )
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading invite...</p>
        </div>
      </div>
    }>
      <JoinGroupContent />
    </Suspense>
  )
}
