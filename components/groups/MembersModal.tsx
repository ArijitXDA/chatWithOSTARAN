"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface Member {
  id: string
  user_id: string
  role: 'creator' | 'admin' | 'member'
  joined_at: string
  first_name: string
  last_name: string
  total_tokens?: number
}

interface MembersModalProps {
  groupId: string
  groupName: string
  currentUserId: string
  onClose: () => void
  onLeaveGroup?: () => void
  onDeleteGroup?: () => void
}

export function MembersModal({
  groupId,
  groupName,
  currentUserId,
  onClose,
  onLeaveGroup,
  onDeleteGroup,
}: MembersModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [totalTokens, setTotalTokens] = useState(0)
  const currentMember = members.find((m) => m.user_id === currentUserId)
  const isCreator = currentMember?.role === 'creator'

  useEffect(() => {
    fetchMembers()
  }, [groupId])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`)
      if (!response.ok) throw new Error('Failed to load members')

      const { members: fetchedMembers, totalTokens: tokens } = await response.json()
      setMembers(fetchedMembers)
      setTotalTokens(tokens || 0)
    } catch (error) {
      console.error('Failed to fetch members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the group?`)) return

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove member')

      toast.success(`${memberName} removed from group`)
      fetchMembers()
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error('Failed to remove member')
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm(`Are you sure you want to leave "${groupName}"?`)) return

    try {
      const membershipId = members.find((m) => m.user_id === currentUserId)?.id
      if (!membershipId) throw new Error('Membership not found')

      const response = await fetch(`/api/groups/${groupId}/members/${membershipId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to leave group')

      toast.success('Left group successfully')
      onLeaveGroup?.()
      onClose()
    } catch (error) {
      console.error('Failed to leave group:', error)
      toast.error('Failed to leave group')
    }
  }

  const handleDeleteGroup = async () => {
    if (!confirm(`Delete "${groupName}"? This action cannot be undone and all messages will be lost.`)) return

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete group')

      toast.success('Group deleted successfully')
      onDeleteGroup?.()
      onClose()
    } catch (error) {
      console.error('Failed to delete group:', error)
      toast.error('Failed to delete group')
    }
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      creator: { text: 'Creator', color: 'bg-purple-100 text-purple-800' },
      admin: { text: 'Admin', color: 'bg-blue-100 text-blue-800' },
      member: { text: 'Member', color: 'bg-gray-100 text-gray-800' },
    }
    const badge = badges[role as keyof typeof badges] || badges.member
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold">Group Members</h2>
              <p className="text-sm text-gray-600">{groupName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Total Tokens */}
          <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm font-medium text-green-800">
              📊 Total Group Tokens: <span className="font-bold">{totalTokens.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading members...</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                        {member.user_id === currentUserId && (
                          <span className="text-sm text-gray-500 ml-2">(You)</span>
                        )}
                      </p>
                      {getRoleBadge(member.role)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Joined: {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Tokens: {(member.total_tokens || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Remove button (only for creator, not for themselves) */}
                  {isCreator && member.user_id !== currentUserId && (
                    <Button
                      onClick={() =>
                        handleRemoveMember(member.id, `${member.first_name} ${member.last_name}`)
                      }
                      size="sm"
                      variant="secondary"
                      className="ml-4"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 space-y-3">
          {/* Leave Group (for non-creators) */}
          {!isCreator && (
            <Button
              onClick={handleLeaveGroup}
              className="w-full"
              variant="secondary"
            >
              Leave Group
            </Button>
          )}

          {/* Delete Group (creator only) */}
          {isCreator && (
            <Button
              onClick={handleDeleteGroup}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Group
            </Button>
          )}

          <Button onClick={onClose} className="w-full" variant="primary">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
