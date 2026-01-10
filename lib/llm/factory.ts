import { LLMProvider } from './types'
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
