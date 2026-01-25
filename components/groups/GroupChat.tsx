"use client"

import { useState, useEffect, useRef } from 'react'
import { GroupMessage } from '@/types'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { estimateTokenCount } from '@/lib/utils/tokenCounter'
import { exportGroupChatToCSV } from '@/lib/utils/exportCsv'

interface GroupChatProps {
  groupId: string
  groupName: string
  onShowMembers: () => void
  onShowInvite: () => void
}

export function GroupChat({ groupId, groupName, onShowMembers, onShowInvite }: GroupChatProps) {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (groupId) {
      fetchMessages()
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [groupId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/messages`)
      if (!response.ok) throw new Error('Failed to load messages')

      const { messages: fetchedMessages } = await response.json()
      setMessages(fetchedMessages)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleExportCSV = () => {
    if (messages.length === 0) {
      toast.error('No messages to export')
      return
    }
    exportGroupChatToCSV(messages, groupName)
    toast.success('Chat exported to CSV')
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || sending) return

    setSending(true)
    console.log('[GroupChat] Sending message:', newMessage.trim())

    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      console.log('[GroupChat] Response status:', response.status)

      if (!response.ok) throw new Error('Failed to send message')

      const result = await response.json()
      console.log('[GroupChat] Response data:', result)

      const { userMessage, aiMessage, aiResponded, reason } = result

      console.log('[GroupChat] AI Decision:', { aiResponded, reason })

      // Add user message
      setMessages((prev) => [...prev, userMessage])

      // Add AI message if responded
      if (aiResponded && aiMessage) {
        console.log('[GroupChat] Adding AI message:', aiMessage)
        setMessages((prev) => [...prev, aiMessage])
      } else {
        console.log('[GroupChat] AI did not respond. Reason:', reason)
      }

      setNewMessage('')
    } catch (error) {
      console.error('[GroupChat] Error:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{groupName}</h2>
          <p className="text-xs text-gray-500">
            Group Chat • oStaran is monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onShowMembers} size="sm" variant="secondary">
            👥 Members
          </Button>
          <Button onClick={onShowInvite} size="sm" variant="secondary">
            ➕ Invite
          </Button>
          <Button onClick={handleExportCSV} size="sm" variant="secondary">
            📥 Export CSV
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">👋 Welcome to the group!</p>
            <p className="text-sm">
              Start chatting. oStaran will join when needed.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_type === 'ai'
                    ? 'bg-purple-100 border-l-4 border-purple-500'
                    : 'bg-blue-100'
                }`}
              >
                <p className="text-xs font-semibold mb-1">
                  {message.sender_type === 'ai' ? '🤖 oStaran' : message.sender_name}
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {message.content}
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{estimateTokenCount(message.content)} tokens</span>
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... (mention @oStaran to get its attention)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          💡 Tip: Mention "oStaran" or "ostaran" to get AI assistance
        </p>
      </div>
    </div>
  )
}
