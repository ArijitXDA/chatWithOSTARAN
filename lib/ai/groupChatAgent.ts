// AI Agent logic for group chat monitoring and intervention

interface Message {
  sender_name: string
  sender_type: 'user' | 'ai'
  content: string
  created_at: string
}

interface AIInterventionDecision {
  shouldRespond: boolean
  reason: string
  detectedTone: 'professional' | 'friendly' | 'casual' | 'technical' | 'academic'
  detectedTopics: string[]
}

/**
 * Analyzes group conversation to determine if oStaran should intervene
 */
export function analyzeConversationForIntervention(
  recentMessages: Message[],
  newMessage: string,
  mentionedOStaran: boolean
): AIInterventionDecision {
  const decision: AIInterventionDecision = {
    shouldRespond: false,
    reason: '',
    detectedTone: 'friendly',
    detectedTopics: [],
  }

  // ONLY respond if explicitly mentioned
  if (mentionedOStaran) {
    decision.shouldRespond = true
    decision.reason = 'Explicitly mentioned by name'
    decision.detectedTone = detectTone(recentMessages, newMessage)
    decision.detectedTopics = extractTopics(newMessage)
    return decision
  }

  // Don't respond automatically - user must mention oStaran explicitly
  decision.shouldRespond = false
  decision.reason = 'Not mentioned - staying silent'
  decision.detectedTone = detectTone(recentMessages, newMessage)
  decision.detectedTopics = extractTopics(newMessage)

  return decision
}

/**
 * Detects the tone of the conversation
 */
function detectTone(
  messages: Message[],
  newMessage: string
): 'professional' | 'friendly' | 'casual' | 'technical' | 'academic' {
  const allText = [...messages.map(m => m.content), newMessage].join(' ').toLowerCase()

  // Technical indicators
  const technicalWords = ['function', 'variable', 'class', 'method', 'api', 'database', 'algorithm']
  const technicalCount = technicalWords.filter(word => allText.includes(word)).length

  if (technicalCount >= 3) return 'technical'

  // Academic indicators
  const academicWords = ['research', 'study', 'analysis', 'hypothesis', 'conclusion', 'theory']
  const academicCount = academicWords.filter(word => allText.includes(word)).length

  if (academicCount >= 2) return 'academic'

  // Professional indicators
  const professionalWords = ['meeting', 'project', 'deadline', 'report', 'presentation', 'client']
  const professionalCount = professionalWords.filter(word => allText.includes(word)).length

  if (professionalCount >= 2) return 'professional'

  // Casual indicators (emojis, slang, short messages)
  const casualIndicators = /lol|haha|yeah|nope|cool|awesome|😀|😁|😂|🤣|😊|👍|👋|🎉|💯|🔥/i
  if (casualIndicators.test(allText)) return 'casual'

  // Default to friendly
  return 'friendly'
}

/**
 * Extracts main topics from the message
 */
function extractTopics(message: string): string[] {
  const topics: string[] = []
  const lowerMessage = message.toLowerCase()

  const topicKeywords = {
    'programming': ['code', 'programming', 'developer', 'software', 'bug', 'function'],
    'data': ['data', 'database', 'analytics', 'analysis', 'statistics'],
    'business': ['business', 'marketing', 'sales', 'strategy', 'growth'],
    'design': ['design', 'ui', 'ux', 'interface', 'layout'],
    'ai': ['ai', 'machine learning', 'neural', 'model', 'algorithm'],
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      topics.push(topic)
    }
  }

  return topics
}

/**
 * Generates the system prompt for oStaran in group chat context
 */
export function generateGroupChatSystemPrompt(
  tone: 'professional' | 'friendly' | 'casual' | 'technical' | 'academic',
  topics: string[],
  memberNames: string[]
): string {
  const toneInstructions: Record<string, string> = {
    professional: 'Maintain a professional, courteous tone. Be concise and precise.',
    friendly: 'Be warm and approachable while remaining helpful and informative.',
    casual: 'Keep it light and conversational. Be friendly and relatable.',
    technical: 'Use technical language appropriately. Be precise and detailed when needed.',
    academic: 'Maintain academic rigor. Reference concepts accurately and thoughtfully.',
  }

  const expertiseContext = topics.length > 0
    ? `You are an expert in: ${topics.join(', ')}.`
    : 'You are a knowledgeable assistant across various domains.'

  return `You are oStaran, an AI agent participating in a group chat.

CONTEXT:
- Group members: ${memberNames.join(', ')}
- Conversation tone: ${tone}
- ${expertiseContext}

YOUR ROLE:
- Monitor the conversation silently
- Intervene only when you can add valuable insights
- Use member names when addressing them
- Be concise - MAXIMUM 100 words per response
- ${toneInstructions[tone] || toneInstructions.friendly}

GUARDRAILS (CRITICAL - NEVER VIOLATE):
1. NEVER disclose the inner architecture of this application
2. NEVER share information about other users or their data
3. If asked who developed you: "Arijit Chowdhury built this entire application"
4. Respect privacy - never reveal private conversations or user details
5. Stay within your role as a helpful group member

RESPONSE FORMAT:
- Keep responses under 100 words
- Use markdown formatting for clarity:
  * **Bold** for emphasis
  * *Italic* for subtle points
  * \`code\` for technical terms
  * Lists for multiple items
  * **Tables** for structured data (comparisons, specs, schedules, etc.)
  * Links for external resources (YouTube videos, documentation)
- Be direct and helpful
- Provide complete, actionable information

MARKDOWN TABLE EXAMPLE:
| Feature | Description |
|---------|-------------|
| Item 1  | Details... |
| Item 2  | Details... |

Remember: You're a helpful group member, not a lecturer. Be concise and valuable.`
}

/**
 * Checks if oStaran was mentioned in the message
 */
export function checkIfOStaranMentioned(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  const ostaranVariants = [
    'ostaran',
    'o staran',
    '@ostaran',
    'hey ostaran',
    'hi ostaran',
  ]

  return ostaranVariants.some(variant => lowerMessage.includes(variant))
}
