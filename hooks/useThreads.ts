"use client"

import { useState, useEffect } from 'react'
import { ChatThread } from '@/types'

export function useThreads() {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadThreads()
  }, [])

  async function loadThreads() {
    try {
      setLoading(true)
      const response = await fetch('/api/threads/list')
      
      if (!response.ok) {
        throw new Error('Failed to load threads')
      }

      const data = await response.json()
      setThreads(data.threads)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function createThread(config: {
    model: string
    persona: string
    temperature: number
    customPersonaId?: string | null
  }) {
    try {
      const response = await fetch('/api/threads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Failed to create thread')
      }

      const data = await response.json()
      setThreads(prev => [data.thread, ...prev])
      return data.thread
    } catch (err) {
      throw err
    }
  }

  async function deleteThread(threadId: string) {
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete thread')
      }

      setThreads(prev => prev.filter(t => t.id !== threadId))
    } catch (err) {
      throw err
    }
  }

  return {
    threads,
    loading,
    error,
    loadThreads,
    createThread,
    deleteThread,
  }
}
