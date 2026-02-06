"use client"

import { useState, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { WebSearchModal } from './WebSearchModal'
import { FileUploadArea } from './FileUploadArea'
import { UploadedFile } from '@/types/chat'
import { Paperclip } from 'lucide-react'

interface PromptInputProps {
  onSend: (message: string, files?: UploadedFile[]) => void
  disabled?: boolean
}

export function PromptInput({ onSend, disabled }: PromptInputProps) {
  const [input, setInput] = useState('')
  const [showWebSearch, setShowWebSearch] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleSend = () => {
    if ((input.trim() || uploadedFiles.length > 0) && !disabled) {
      onSend(input.trim(), uploadedFiles.length > 0 ? uploadedFiles : undefined)
      setInput('')
      setUploadedFiles([])
      setShowFileUpload(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleUseSearchResults = (formattedResults: string) => {
    // Prepend search results to the current input
    const newInput = input.trim()
      ? `${formattedResults}\n\n${input}`
      : formattedResults
    setInput(newInput)
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex gap-2 mb-2">
        <Button
          onClick={() => setShowWebSearch(true)}
          variant="secondary"
          size="sm"
          disabled={disabled}
        >
          🔍 Web Search
        </Button>
        <Button
          onClick={() => setShowFileUpload(!showFileUpload)}
          variant="secondary"
          size="sm"
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4 mr-1" />
          {showFileUpload ? 'Hide Upload' : 'Attach Files'}
          {uploadedFiles.length > 0 && ` (${uploadedFiles.length})`}
        </Button>
      </div>

      {/* File Upload Area */}
      {showFileUpload && (
        <div className="mb-3">
          <FileUploadArea
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
          />
        </div>
      )}

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
          disabled={disabled || (!input.trim() && uploadedFiles.length === 0)}
          className="self-end"
        >
          Send
        </Button>
      </div>

      {/* Web Search Modal */}
      {showWebSearch && (
        <WebSearchModal
          onClose={() => setShowWebSearch(false)}
          onUseResults={handleUseSearchResults}
        />
      )}
    </div>
  )
}
