#!/usr/bin/env python3
import os

PROJECT_ROOT = "/home/claude/ai-agent-platform"

# This dict contains ALL files with their complete content
ALL_FILES = {
    # Already created, skipping: package.json, .env.example, .gitignore, next.config.js, 
    # tailwind.config.ts, tsconfig.json, postcss.config.mjs, middleware.ts, README.md, SUPABASE_SCHEMA.sql
    # types/database.ts, types/chat.ts, types/index.ts, lib/supabase/client.ts, lib/supabase/server.ts
    
    # ==== LIB - LLM ====
    "lib/llm/types.ts": '''export interface LLMMessage {
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
''',

    "lib/llm/providers/base.ts": '''import { LLMProvider } from '../types'

export abstract class BaseLLMProvider implements LLMProvider {
  abstract name: string
  abstract displayName: string
  abstract isAvailable: boolean

  protected abstract apiKey: string | undefined

  abstract chat(params: any): Promise<any>
  
  streamChat?(params: any): AsyncIterableIterator<string> {
    throw new Error('Streaming not implemented for this provider')
  }

  protected checkAvailability(): void {
    if (!this.isAvailable) {
      throw new Error(
        `${this.displayName} is not available. Please configure API key.`
      )
    }
  }
}
''',

    "lib/llm/providers/claude.ts": '''import Anthropic from '@anthropic-ai/sdk'
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
      .join('\\n\\n')

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
      .join('\\n\\n')

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
''',

    "lib/llm/providers/openai.ts": '''import OpenAI from 'openai'
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
''',

    "lib/llm/providers/gemini.ts": '''import { BaseLLMProvider } from './base'
import { LLMChatParams, LLMChatResponse } from '../types'

export class GeminiProvider extends BaseLLMProvider {
  name = 'gemini'
  displayName = 'Gemini (Google)'
  
  protected apiKey = process.env.GOOGLE_API_KEY
  isAvailable = !!this.apiKey

  async chat(params: LLMChatParams): Promise<LLMChatResponse> {
    this.checkAvailability()

    const contents = params.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const systemInstruction = params.messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\\n\\n')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: params.temperature || 0.7,
            maxOutputTokens: params.maxTokens || 4096,
          },
        }),
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error')
    }

    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: 'gemini-pro',
    }
  }
}
''',

    "lib/llm/providers/index.ts": '''export { ClaudeProvider } from './claude'
export { OpenAIProvider } from './openai'
export { GeminiProvider } from './gemini'
''',

    "lib/llm/factory.ts": '''import { LLMProvider } from './types'
import { ClaudeProvider, OpenAIProvider, GeminiProvider } from './providers'
import { ModelType } from '@/types'

const providers: Record<string, LLMProvider> = {
  claude: new ClaudeProvider(),
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
}

export function getProvider(model: ModelType): LLMProvider {
  const provider = providers[model]
  
  if (!provider) {
    throw new Error(`Unknown model: ${model}`)
  }

  if (!provider.isAvailable) {
    throw new Error(
      `${provider.displayName} is not configured. Please add API key to environment variables.`
    )
  }

  return provider
}

export function getAvailableModels(): Array<{
  id: ModelType
  name: string
  available: boolean
}> {
  return [
    {
      id: 'claude',
      name: 'Claude (Anthropic)',
      available: providers.claude.isAvailable,
    },
    {
      id: 'openai',
      name: 'GPT-4 (OpenAI)',
      available: providers.openai.isAvailable,
    },
    {
      id: 'gemini',
      name: 'Gemini (Google)',
      available: providers.gemini.isAvailable,
    },
    {
      id: 'grok',
      name: 'Grok (xAI)',
      available: false,
    },
    {
      id: 'ostaran-llm',
      name: 'oStaran LLM',
      available: false,
    },
    {
      id: 'ostaran-slm',
      name: 'oStaran SLM',
      available: false,
    },
  ]
}
''',
}

# Create all files
total = 0
for filepath, content in ALL_FILES.items():
    full_path = os.path.join(PROJECT_ROOT, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    total += 1

print(f"✅ Created {total} LLM files")
