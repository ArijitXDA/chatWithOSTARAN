import Anthropic from '@anthropic-ai/sdk'
import { BaseLLMProvider } from './base'
import { LLMChatParams, LLMChatResponse } from '../types'

export class ClaudeProvider extends BaseLLMProvider {
  name = 'claude'
  displayName = 'Claude (Anthropic)'
  
  protected apiKey = process.env.ANTHROPIC_API_KEY
  isAvailable = !!this.apiKey

  private client: Anthropic | null = null

  constructor() {
    super()
    if (this.isAvailable) {
      this.client = new Anthropic({
        apiKey: this.apiKey!,
      })
    }
  }

  async chat(params: LLMChatParams): Promise<LLMChatResponse> {
    this.checkAvailability()

    const systemMessages = params.messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n')

    const conversationMessages = params.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await this.client!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature || 0.7,
      system: systemMessages || undefined,
      messages: conversationMessages,
    })

    const content = response.content[0]
    const textContent = content.type === 'text' ? content.text : ''

    return {
      content: textContent,
      model: response.model,
      tokenCount: response.usage.input_tokens + response.usage.output_tokens,
    }
  }

  async *streamChat(params: LLMChatParams): AsyncIterableIterator<string> {
    this.checkAvailability()

    const systemMessages = params.messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n')

    const conversationMessages = params.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const stream = await this.client!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature || 0.7,
      system: systemMessages || undefined,
      messages: conversationMessages,
      stream: true,
    })

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text
      }
    }
  }
}
