import { BaseLLMProvider } from './base'
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
      .join('\n\n')

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
