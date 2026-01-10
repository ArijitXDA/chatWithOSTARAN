import OpenAI from 'openai'
import { BaseLLMProvider } from './base'
import { LLMChatParams, LLMChatResponse } from '../types'

export class OpenAIProvider extends BaseLLMProvider {
  name = 'openai'
  displayName = 'GPT-4 (OpenAI)'
  
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

    const response = await this.client!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: params.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 4096,
    })

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      tokenCount: response.usage?.total_tokens,
    }
  }

  async *streamChat(params: LLMChatParams): AsyncIterableIterator<string> {
    this.checkAvailability()

    const stream = await this.client!.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: params.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
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
