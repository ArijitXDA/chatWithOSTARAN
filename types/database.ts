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
  temperature: number
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
    }
  }
}