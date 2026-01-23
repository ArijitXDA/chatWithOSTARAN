"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GroupList } from '@/components/groups/GroupList'
import { GroupChat } from '@/components/groups/GroupChat'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { InviteMemberModal } from '@/components/groups/InviteMemberModal'
import { Button } from '@/components/ui/Button'

export default function GroupsPage() {
  const router = useRouter()
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null)
  const [currentGroupName, setCurrentGroupName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)

  const handleSelectGroup = async (groupId: string) => {
    setCurrentGroupId(groupId)

    // Fetch group details
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (response.ok) {
        const { group } = await response.json()
        setCurrentGroupName(group.name)
      }
    } catch (error) {
      console.error('Failed to fetch group details:', error)
    }
  }

  const handleGroupCreated = (groupId: string) => {
    handleSelectGroup(groupId)
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' })
      if (response.ok) {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar with group list */}
      <GroupList
        onSelectGroup={handleSelectGroup}
        onCreateGroup={() => setShowCreateModal(true)}
        currentGroupId={currentGroupId || undefined}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation */}
        <div className="bg-white border-b p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">
            🤖 oStaran Group Chats
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/chat')} variant="secondary" size="sm">
              💬 Personal Chat
            </Button>
            <Button onClick={handleSignOut} variant="danger" size="sm">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Group chat or welcome screen */}
        {currentGroupId ? (
          <GroupChat
            groupId={currentGroupId}
            groupName={currentGroupName}
            onShowMembers={() => setShowMembersModal(true)}
            onShowInvite={() => setShowInviteModal(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Group Chats!</h2>
              <p className="text-gray-600 mb-6">
                Create a group or select one from the sidebar to start chatting with friends,
                colleagues, or family - all with oStaran AI monitoring and helping out!
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                + Create Your First Group
              </Button>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  ✨ What makes oStaran groups special?
                </p>
                <ul className="text-xs text-blue-800 text-left space-y-2">
                  <li>• 🤖 AI monitors and joins when helpful</li>
                  <li>• 💡 Adapts to your conversation tone</li>
                  <li>• 📚 Becomes an expert in your topics</li>
                  <li>• 🔒 Respects privacy - never shares data</li>
                  <li>• ⚡ Responds in 10 words or less</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {showInviteModal && currentGroupId && (
        <InviteMemberModal
          groupId={currentGroupId}
          groupName={currentGroupName}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}
