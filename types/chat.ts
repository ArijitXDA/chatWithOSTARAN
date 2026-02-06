import { ModelType, PersonaType } from './database'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface ChatConfig {
  model: ModelType
  persona: PersonaType
  temperature: number
  customPersonaId?: string | null
}

export interface SendMessageParams {
  threadId: string
  content: string
  config: ChatConfig
}

export interface LLMResponse {
  content: string
  model: string
  tokenCount?: number
}

export interface StreamChunk {
  delta: string
  done: boolean
}

export interface FileAttachment {
  id: string
  messageId: string
  userId: string
  fileName: string
  fileType: string
  fileSize: number
  fileCategory: 'image' | 'document' | 'spreadsheet' | 'other'
  storagePath: string
  storageBucket: string
  extractedText?: string
  width?: number
  height?: number
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  processingError?: string
  createdAt: Date
}

export interface UploadedFile {
  file: File
  preview?: string // For images
  category: 'image' | 'document' | 'spreadsheet' | 'other'
  extractedText?: string
  dimensions?: { width: number; height: number }
  base64Data?: string // Base64 encoded image data for vision
}
