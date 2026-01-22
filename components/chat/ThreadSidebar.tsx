"use client"

import { ChatThread } from '@/types'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

interface ThreadSidebarProps {
  threads: ChatThread[]
  currentThreadId?: string
  onSelectThread: (threadId: string) => void
  onNewThread: () => void
  onDeleteThread: (threadId: string) => void
}

export function ThreadSidebar({
  threads,
  currentThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
}: ThreadSidebarProps) {
  const [localThreads, setLocalThreads] = useState(threads)

  // Update local state when props change
  if (threads !== localThreads && threads.length !== localThreads.length) {
    setLocalThreads(threads)
  }

  const toggleFavorite = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    const thread = localThreads.find(t => t.id === threadId)
    if (!thread) return

    // Optimistic update
    setLocalThreads(prevThreads =>
      prevThreads.map(t =>
        t.id === threadId ? { ...t, is_favorite: !t.is_favorite } : t
      )
    )

    try {
      const response = await fetch(`/api/threads/${threadId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !thread.is_favorite }),
      })

      if (!response.ok) {
        // Revert on error
        setLocalThreads(prevThreads =>
          prevThreads.map(t =>
            t.id === threadId ? { ...t, is_favorite: thread.is_favorite } : t
          )
        )
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      // Revert on error
      setLocalThreads(prevThreads =>
        prevThreads.map(t =>
          t.id === threadId ? { ...t, is_favorite: thread.is_favorite } : t
        )
      )
    }
  }

  // Sort threads: favorites first, then by updated_at
  const sortedThreads = [...localThreads].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1
    if (!a.is_favorite && b.is_favorite) return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Button
          onClick={onNewThread}
          className="w-full"
          size="sm"
        >
          + New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sortedThreads.length === 0 ? (
          <p className="text-sm text-gray-500 text-center p-4">
            No conversations yet
          </p>
        ) : (
          sortedThreads.map((thread) => (
            <div
              key={thread.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors ${
                thread.id === currentThreadId ? 'bg-blue-100' : 'bg-white'
              } ${thread.is_favorite ? 'border-l-4 border-yellow-500' : ''}`}
              onClick={() => onSelectThread(thread.id)}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {thread.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => toggleFavorite(thread.id, e)}
                    className={`transition-colors ${
                      thread.is_favorite
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-300 hover:text-yellow-500'
                    }`}
                    title={thread.is_favorite ? 'Unfavorite' : 'Favorite'}
                  >
                    {thread.is_favorite ? '★' : '☆'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteThread(thread.id)
                    }}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
