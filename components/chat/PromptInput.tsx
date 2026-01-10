"use client"

import { useState, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'

interface PromptInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function PromptInput({ onSend, disabled }: PromptInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="self-end"
        >
          Send
        </Button>
      </div>
    </div>
  )
}
