/**
 * Auto-naming utility for conversations
 * Generates brief, meaningful titles for chat threads
 */

import { getProvider } from '@/lib/llm/factory'

export async function generateThreadTitle(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    // Take first 3 messages for context
    const contextMessages = messages.slice(0, 3)

    // Build context string
    const conversationContext = contextMessages
      .map(msg => `${msg.role}: ${msg.content.substring(0, 200)}`)
      .join('\n')

    // Use GPT-4o-mini for cost efficiency
    const provider = getProvider('openai')

    const prompt = `Based on this conversation, create a brief, descriptive title (maximum 5 words):

${conversationContext}

Title (max 5 words, no quotes):`

    const response = await provider.chat({
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 20,
    })

    let title = response.content.trim()

    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '')

    // Limit to 5 words
    const words = title.split(' ')
    if (words.length > 5) {
      title = words.slice(0, 5).join(' ')
    }

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1)

    console.log('[AutoNaming] Generated title:', title)

    return title || 'New Conversation'
  } catch (error) {
    console.error('[AutoNaming] Error generating title:', error)
    return 'New Conversation'
  }
}

/**
 * Check if thread should be auto-named
 * Returns true if thread has exactly 3 messages and title is still default
 */
export function shouldAutoName(messageCount: number, currentTitle: string): boolean {
  const defaultTitles = ['New Conversation', 'New Chat', '']
  return messageCount === 3 && defaultTitles.includes(currentTitle)
}
