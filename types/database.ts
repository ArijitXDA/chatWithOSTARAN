export interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  mobile?: string
  country_code?: string
  occupation?: string
  age?: number
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  created_at: string
  updated_at: string
}

export interface ChatThread {
  id: string
  user_id: string
  title: string
  model: ModelType
  persona: PersonaType
  custom_persona_id: string | null
  temperature: number
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  thread_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  token_count?: number
  model_used?: string
  created_at: string
}

export interface ConversationSummary {
  id: string
  thread_id: string
  summary: string
  messages_covered: number
  created_at: string
}

export interface CustomPersona {
  id: string
  user_id: string
  name: string
  icon: string
  description?: string
  system_prompt: string

  // Advanced tuning parameters
  temperature_default: number
  max_tokens: number
  top_p: number
  frequency_penalty: number
  presence_penalty: number

  // Behavioral traits
  creativity_level: 'conservative' | 'balanced' | 'creative' | 'experimental'
  formality_level: 'casual' | 'balanced' | 'formal' | 'academic'
  verbosity_level: 'concise' | 'balanced' | 'detailed' | 'comprehensive'

  // Response style preferences
  use_emojis: boolean
  use_markdown: boolean
  use_code_blocks: boolean
  citation_style: 'none' | 'inline' | 'footnotes' | 'academic' | null

  // Knowledge and expertise settings
  expertise_domains: string[] | null
  language_style: 'standard' | 'technical' | 'simplified' | 'storytelling'
  reasoning_style: 'intuitive' | 'balanced' | 'analytical' | 'step_by_step'

  is_active: boolean
  created_at: string
  updated_at: string
}

export type ModelType = 
  | 'claude' 
  | 'openai' 
  | 'gemini' 
  | 'grok' 
  | 'ostaran-llm' 
  | 'ostaran-slm'

export type PersonaType =
  | 'default'
  | 'researcher'
  | 'professor'
  | 'student'
  | 'marketing_manager'
  | 'hr_manager'
  | 'custom'

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      chat_threads: {
        Row: ChatThread
        Insert: Omit<ChatThread, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ChatThread, 'id' | 'created_at' | 'updated_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      conversation_summaries: {
        Row: ConversationSummary
        Insert: Omit<ConversationSummary, 'id' | 'created_at'>
        Update: Partial<Omit<ConversationSummary, 'id' | 'created_at'>>
      }
      custom_personas: {
        Row: CustomPersona
        Insert: Omit<CustomPersona, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CustomPersona, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}