export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } }

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | ContentBlock[]
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
  tool_call_id?: string
  name?: string
}

export interface LLMTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: any
  }
}

export interface LLMChatParams {
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
  tools?: LLMTool[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
}

export interface LLMChatResponse {
  content: string
  model: string
  tokenCount?: number
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
  finish_reason?: string
}

export interface LLMProvider {
  name: string
  displayName: string
  isAvailable: boolean
  supportsTools?: boolean
  chat(params: LLMChatParams): Promise<LLMChatResponse>
  streamChat?(params: LLMChatParams): AsyncIterableIterator<string>
}
