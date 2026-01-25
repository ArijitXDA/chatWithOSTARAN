/**
 * Detects if a user query requires web search
 */
export function shouldAutoSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim()

  // Temporal keywords - questions about recent/current events
  const temporalKeywords = [
    'today',
    'yesterday',
    'this week',
    'this month',
    'recently',
    'latest',
    'current',
    'now',
    'right now',
    'currently',
    'this year',
    'last week',
    'last month',
  ]

  // Weather-related queries
  const weatherKeywords = ['weather', 'rain', 'temperature', 'forecast', 'climate']

  // News and current events
  const newsKeywords = [
    'news',
    'breaking',
    'update',
    'announcement',
    'happened',
    'happening',
  ]

  // Real-time data queries
  const realTimeKeywords = [
    'price',
    'stock',
    'score',
    'result',
    'status',
    'live',
    'real-time',
  ]

  // Search intent keywords
  const searchIntents = [
    'search for',
    'find',
    'look up',
    'what is',
    'who is',
    'when did',
    'where is',
    'how to',
  ]

  // Check for temporal keywords
  const hasTemporal = temporalKeywords.some((keyword) => lowerQuery.includes(keyword))

  // Check for weather queries
  const hasWeather = weatherKeywords.some((keyword) => lowerQuery.includes(keyword))

  // Check for news queries
  const hasNews = newsKeywords.some((keyword) => lowerQuery.includes(keyword))

  // Check for real-time data
  const hasRealTime = realTimeKeywords.some((keyword) => lowerQuery.includes(keyword))

  // Check for explicit search intent
  const hasSearchIntent = searchIntents.some((keyword) => lowerQuery.includes(keyword))

  // Auto-search if:
  // 1. Temporal + (Weather OR News OR Real-time data)
  // 2. Explicit search intent
  // 3. Questions about recent events
  if (hasTemporal && (hasWeather || hasNews || hasRealTime)) {
    return true
  }

  if (hasSearchIntent) {
    return true
  }

  // Specific patterns for common queries
  const autoSearchPatterns = [
    /did .+ (happen|occur|rain|snow)/i,
    /what (happened|is happening)/i,
    /latest .+ (news|update|version|release)/i,
    /current .+ (price|status|weather)/i,
    /(today|yesterday|this week).+(weather|news|events?)/i,
  ]

  return autoSearchPatterns.some((pattern) => pattern.test(query))
}

/**
 * Extracts a clean search query from the user's message
 */
export function extractSearchQuery(query: string): string {
  // Remove common conversational prefixes
  const cleanedQuery = query
    .replace(/^(can you |could you |please )/i, '')
    .replace(/^(tell me |find out )/i, '')
    .replace(/^(search for |look up )/i, '')
    .trim()

  return cleanedQuery
}
