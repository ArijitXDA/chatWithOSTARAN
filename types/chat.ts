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
