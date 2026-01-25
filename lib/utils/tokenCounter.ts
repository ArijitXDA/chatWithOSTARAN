/**
 * Estimates token count for a given text
 * Uses a simple heuristic: ~4 characters per token (OpenAI's rule of thumb)
 *
 * For more accurate counting, we could use a library like:
 * - gpt-3-encoder
 * - tiktoken
 * - anthropic's token counter
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0

  // Simple estimation: ~4 characters per token
  // This is a rough approximation but works for display purposes
  return Math.ceil(text.length / 4)
}

/**
 * Formats token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k tokens`
  }
  return `${tokens} tokens`
}
