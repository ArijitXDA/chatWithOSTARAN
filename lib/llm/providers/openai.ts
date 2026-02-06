import OpenAI from 'openai'
import { BaseLLMProvider } from './base'
import { LLMChatParams, LLMChatResponse } from '../types'

export class OpenAIProvider extends BaseLLMProvider {
  name = 'openai'
  displayName = 'GPT-4 (OpenAI)'
  supportsTools = true

  protected apiKey = process.env.OPENAI_API_KEY
  isAvailable = !!this.apiKey

  private client: OpenAI | null = null

  constructor() {
    super()
    if (this.isAvailable) {
      this.client = new OpenAI({
        apiKey: this.apiKey!,
      })
    }
  }

  async chat(params: LLMChatParams): Promise<LLMChatResponse> {
    this.checkAvailability()

    // Map LLM messages to OpenAI format
    const messages = params.messages.map(m => {
      if (m.role === 'tool') {
        // Tool messages require tool_call_id
        return {
          role: 'tool' as const,
          content: typeof m.content === 'string' ? m.content : m.content.find(b => b.type === 'text')?.text || '',
          tool_call_id: m.tool_call_id!,
        }
      } else if (m.role === 'assistant' && m.tool_calls) {
        // Assistant with tool calls
        return {
          role: 'assistant' as const,
          content: typeof m.content === 'string' ? m.content : m.content.find(b => b.type === 'text')?.text || null,
          tool_calls: m.tool_calls,
        }
      } else {
        // Regular message or vision message
        let content: any = m.content

        // Convert our ContentBlock[] format to OpenAI's format
        if (Array.isArray(m.content)) {
          content = m.content.map(block => {
            if (block.type === 'text') {
              return { type: 'text', text: block.text }
            } else if (block.type === 'image') {
              // Convert base64 image to OpenAI format
              const { media_type, data } = block.source
              return {
                type: 'image_url',
                image_url: {
                  url: `data:${media_type};base64,${data}`
                }
              }
            }
            return block
          })
        }

        return {
          role: m.role as 'system' | 'user' | 'assistant',
          content,
        }
      }
    })

    const requestParams: any = {
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 4096,
    }

    // Add tools if provided
    if (params.tools && params.tools.length > 0) {
      requestParams.tools = params.tools
      if (params.tool_choice) {
        requestParams.tool_choice = params.tool_choice
      }
    }

    const response = await this.client!.chat.completions.create(requestParams)

    const message = response.choices[0]?.message

    return {
      content: message?.content || '',
      model: response.model,
      tokenCount: response.usage?.total_tokens,
      tool_calls: message?.tool_calls as any,
      finish_reason: response.choices[0]?.finish_reason,
    }
  }

  async *streamChat(params: LLMChatParams): AsyncIterableIterator<string> {
    this.checkAvailability()

    // Map LLM messages to OpenAI format (same as chat method)
    const messages = params.messages.map(m => {
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          content: typeof m.content === 'string' ? m.content : m.content.find(b => b.type === 'text')?.text || '',
          tool_call_id: m.tool_call_id!,
        }
      } else if (m.role === 'assistant' && m.tool_calls) {
        return {
          role: 'assistant' as const,
          content: typeof m.content === 'string' ? m.content : m.content.find(b => b.type === 'text')?.text || null,
          tool_calls: m.tool_calls,
        }
      } else {
        // Regular message or vision message
        let content: any = m.content

        // Convert our ContentBlock[] format to OpenAI's format
        if (Array.isArray(m.content)) {
          content = m.content.map(block => {
            if (block.type === 'text') {
              return { type: 'text', text: block.text }
            } else if (block.type === 'image') {
              // Convert base64 image to OpenAI format
              const { media_type, data } = block.source
              return {
                type: 'image_url',
                image_url: {
                  url: `data:${media_type};base64,${data}`
                }
              }
            }
            return block
          })
        }

        return {
          role: m.role as 'system' | 'user' | 'assistant',
          content,
        }
      }
    })

    const stream = await this.client!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 4096,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}
