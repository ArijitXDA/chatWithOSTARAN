"use client"

import { useState, useEffect } from 'react'
import { Group } from '@/types'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface GroupListProps {
  onSelectGroup: (groupId: string) => void
  onCreateGroup: () => void
  currentGroupId?: string
}

export function GroupList({ onSelectGroup, onCreateGroup, currentGroupId }: GroupListProps) {
  const [groups, setGroups] = useState<(Group & { member_count?: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups/list')
      if (!response.ok) throw new Error('Failed to load groups')

      const { groups: fetchedGroups } = await response.json()
      setGroups(fetchedGroups)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const refreshGroups = () => {
    fetchGroups()
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading groups...
      </div>
    )
  }

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onCreateGroup} className="w-full" size="sm">
          + Create Group
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.length === 0 ? (
          <p className="text-sm text-gray-500 text-center p-4">
            No groups yet. Create one to start!
          </p>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors ${
                group.id === currentGroupId ? 'bg-blue-100' : 'bg-white'
              }`}
              onClick={() => onSelectGroup(group.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {group.name}
                  </p>
                  {group.description && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {group.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    👥 {group.member_count || 0} members
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t bg-white">
        <button
          onClick={refreshGroups}
          className="w-full text-sm text-blue-600 hover:text-blue-700"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  )
}
