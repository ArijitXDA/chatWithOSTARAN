/**
 * Tavily Web Search Tool
 * Provides real-time web search capabilities to oStaran
 */

interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

interface TavilyResponse {
  query: string
  answer?: string
  results: TavilySearchResult[]
  images?: string[]
}

export async function searchWeb(query: string, maxResults: number = 5): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY not configured')
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: 'basic', // 'basic' or 'advanced'
        include_answer: true, // Get AI-generated answer
        include_images: false,
        include_raw_content: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`)
    }

    const data: TavilyResponse = await response.json()
    return data
  } catch (error) {
    console.error('Tavily search error:', error)
    throw error
  }
}

/**
 * Format search results for LLM context
 */
export function formatSearchResultsForLLM(results: TavilyResponse): string {
  let formatted = `**Web Search Results for: "${results.query}"**\n\n`
  formatted += `*Use the following current, real-time information from the web to answer the user's question accurately.*\n\n`

  if (results.answer) {
    formatted += `**Quick Answer:** ${results.answer}\n\n`
  }

  formatted += `**Sources:**\n\n`
  results.results.forEach((result, index) => {
    formatted += `${index + 1}. **${result.title}**\n`
    formatted += `   ${result.content.substring(0, 300)}...\n`
    formatted += `   Source: ${result.url}\n`
    if (result.published_date) {
      formatted += `   Published: ${result.published_date}\n`
    }
    formatted += `\n`
  })

  formatted += `\n**Instructions:** Based on the above search results, provide a comprehensive answer to the user's question. Cite specific sources when possible.`

  return formatted
}
