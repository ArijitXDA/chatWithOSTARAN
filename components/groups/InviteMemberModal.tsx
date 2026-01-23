"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface InviteMemberModalProps {
  groupId: string
  groupName: string
  onClose: () => void
}

export function InviteMemberModal({ groupId, groupName, onClose }: InviteMemberModalProps) {
  const [inviteLink, setInviteLink] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchInviteCode()
  }, [groupId])

  const fetchInviteCode = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (!response.ok) throw new Error('Failed to fetch group details')

      const { group } = await response.json()
      setInviteCode(group.invite_code)

      // Generate invite link
      const baseUrl = window.location.origin
      const link = `${baseUrl}/groups/join?code=${group.invite_code}`
      setInviteLink(link)
    } catch (error) {
      console.error('Failed to fetch invite code:', error)
      toast.error('Failed to load invite link')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnWhatsApp = () => {
    const message = `Join "${groupName}" on oStaran! Click: ${inviteLink}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-2">Invite Members</h2>
        <p className="text-sm text-gray-600 mb-4">to "{groupName}"</p>

        <div className="space-y-4">
          {/* Invite Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-100 border rounded-lg font-mono text-sm"
              />
              <Button onClick={copyToClipboard} size="sm">
                {copied ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Invite Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Link
            </label>
            <div className="p-3 bg-gray-100 rounded-lg border break-all text-sm">
              {inviteLink}
            </div>
          </div>

          {/* Share Options */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Share via:
            </p>
            <div className="flex gap-2">
              <Button onClick={shareOnWhatsApp} className="flex-1" variant="secondary">
                <span className="mr-2">💬</span> WhatsApp
              </Button>
              <Button onClick={copyToClipboard} className="flex-1" variant="secondary">
                <span className="mr-2">📋</span> Copy Link
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800 font-medium mb-2">
              📌 How it works:
            </p>
            <ul className="text-xs text-green-700 space-y-1 ml-4">
              <li>• Share the link with friends/colleagues</li>
              <li>• New users will be asked to sign up</li>
              <li>• Existing users join immediately</li>
              <li>• Everyone can chat with oStaran AI!</li>
            </ul>
          </div>

          <Button onClick={onClose} className="w-full" variant="primary">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
