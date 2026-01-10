import { LLMProvider } from '../types'

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
