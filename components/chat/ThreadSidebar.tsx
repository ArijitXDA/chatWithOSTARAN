"use client"

import { ChatThread } from '@/types'
import { Button } from '@/components/ui/Button'

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
        {threads.length === 0 ? (
          <p className="text-sm text-gray-500 text-center p-4">
            No conversations yet
          </p>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors ${
                thread.id === currentThreadId ? 'bg-blue-100' : 'bg-white'
              }`}
              onClick={() => onSelectThread(thread.id)}
            >
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-900 truncate flex-1">
                  {thread.title}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteThread(thread.id)
                  }}
                  className="text-gray-400 hover:text-red-600 ml-2"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(thread.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
