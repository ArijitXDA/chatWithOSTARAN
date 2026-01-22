import { LLMMessage } from '../llm/types'
import { Message } from '@/types'
import { getPersona } from '../personas/definitions'
import { PersonaType } from '@/types'

export interface AssemblePromptParams {
  persona: PersonaType
  conversationHistory: Message[]
  userPrompt: string
  customSystemPrompt?: string // For custom personas
}

export function assemblePrompt(params: AssemblePromptParams): LLMMessage[] {
  const { persona, conversationHistory, userPrompt, customSystemPrompt } = params

  const personaConfig = getPersona(persona)

  const messages: LLMMessage[] = []

  // Use custom system prompt if provided, otherwise use persona's default
  const systemPrompt = customSystemPrompt || personaConfig.systemPrompt

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    })
  }

  conversationHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }
  })

  messages.push({
    role: 'user',
    content: userPrompt,
  })

  return messages
}

export function generateThreadTitle(firstMessage: string): string {
  const title = firstMessage.slice(0, 50)
  return firstMessage.length > 50 ? `${title}...` : title
}
