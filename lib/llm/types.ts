export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMChatParams {
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface LLMChatResponse {
  content: string
  model: string
  tokenCount?: number
}

export interface LLMProvider {
  name: string
  displayName: string
  isAvailable: boolean
  chat(params: LLMChatParams): Promise<LLMChatResponse>
  streamChat?(params: LLMChatParams): AsyncIterableIterator<string>
}
