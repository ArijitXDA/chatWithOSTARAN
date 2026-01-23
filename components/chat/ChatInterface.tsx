"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageList } from './MessageList'
import { PromptInput } from './PromptInput'
import { ModelSelector } from './ModelSelector'
import { PersonaSelector } from './PersonaSelector'
import { TemperatureControl } from './TemperatureControl'
import { ThreadSidebar } from './ThreadSidebar'
import { Button } from '@/components/ui/Button'
import { ChatMessage, ChatConfig, ChatThread, ModelType, PersonaType } from '@/types'
import { useThreads } from '@/hooks/useThreads'
import toast from 'react-hot-toast'

interface ChatInterfaceProps {
  userName: string
  onSignOut: () => void
}

export function ChatInterface({ userName, onSignOut }: ChatInterfaceProps) {
  const router = useRouter()
  const { threads, loading: threadsLoading, createThread, deleteThread } = useThreads()
  
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  
  const [config, setConfig] = useState<ChatConfig>({
    model: 'claude' as ModelType,
    persona: 'default' as PersonaType,
    temperature: 0.7,
    customPersonaId: null,
  })

  // Load messages when thread changes
  useEffect(() => {
    if (currentThreadId) {
      loadMessages(currentThreadId)
    } else {
      setMessages([])
    }
  }, [currentThreadId])

  const loadMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/messages`)
      if (!response.ok) throw new Error('Failed to load messages')
      
      const data = await response.json()
      setMessages(
        data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))
      )
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const handleNewThread = async () => {
    try {
      const thread = await createThread(config)
      setCurrentThreadId(thread.id)
      setMessages([])
      toast.success('New conversation started')
    } catch (error) {
      console.error('Failed to create thread:', error)
      toast.error('Failed to create new conversation')
    }
  }

  const handleSelectThread = (threadId: string) => {
    setCurrentThreadId(threadId)
  }

  const handleDeleteThread = async (threadId: string) => {
    if (confirm('Delete this conversation?')) {
      try {
        await deleteThread(threadId)
        if (currentThreadId === threadId) {
          setCurrentThreadId(null)
          setMessages([])
        }
        toast.success('Conversation deleted')
      } catch (error) {
        console.error('Failed to delete thread:', error)
        toast.error('Failed to delete conversation')
      }
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!currentThreadId) {
      // Create new thread if none exists
      try {
        const thread = await createThread(config)
        setCurrentThreadId(thread.id)
        // Will send message after thread is created via useEffect
        setTimeout(() => sendMessageToThread(thread.id, content), 100)
      } catch (error) {
        toast.error('Failed to create conversation')
        return
      }
      return
    }

    await sendMessageToThread(currentThreadId, content)
  }

  const sendMessageToThread = async (threadId: string, content: string) => {
    setIsLoading(true)

    // Add user message
    const userMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Add assistant message placeholder
    const assistantId = `temp-assistant-${Date.now()}`
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          content,
          config,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.delta) {
                accumulatedContent += parsed.delta
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                )
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg
        )
      )

      // Reload messages from server to get actual IDs
      await loadMessages(threadId)
    } catch (error) {
      console.error('Send message error:', error)
      toast.error('Failed to send message')
      // Remove failed messages
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id && msg.id !== assistantId)
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {showSidebar && (
        <ThreadSidebar
          threads={threads}
          currentThreadId={currentThreadId || undefined}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-600 hover:text-gray-900"
            >
              ☰
            </button>
            <h1 className="text-xl font-semibold">
              Hey {userName}, what's up today?
            </h1>
          </div>
          <Button onClick={onSignOut} variant="danger" size="sm">
            Sign Out
          </Button>
        </div>

        {/* Settings Bar */}
        <div className="bg-white border-b p-4">
          <div className="grid grid-cols-3 gap-4 max-w-4xl">
            <ModelSelector
              value={config.model}
              onChange={(model) => setConfig({ ...config, model })}
            />
            <PersonaSelector
              value={config.persona}
              customPersonaId={config.customPersonaId}
              onChange={(persona, customPersonaId) =>
                setConfig({ ...config, persona, customPersonaId: customPersonaId ?? null })
              }
            />
            <TemperatureControl
              value={config.temperature}
              onChange={(temperature) => setConfig({ ...config, temperature })}
            />
          </div>
        </div>

        {/* Messages */}
        <MessageList messages={messages} />

        {/* Input */}
        <PromptInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}
