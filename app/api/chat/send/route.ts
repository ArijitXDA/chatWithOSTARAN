// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/llm/factory'
import { assemblePrompt } from '@/lib/utils/prompts'
import { estimateTokens } from '@/lib/utils/token-counter'

export async function POST(request: Request) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createClient()
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          controller.close()
          return
        }

        const { threadId, content, config } = await request.json()

        // Load thread
        const { data: thread, error: threadError } = await supabase
          .from('chat_threads')
          .select('*')
          .eq('id', threadId)
          .single()

        if (threadError || !thread) {
          controller.close()
          return
        }

        // Save user message
        const { error: userMsgError } = await supabase
          .from('messages')
          .insert({
            thread_id: threadId,
            role: 'user',
            content: content,
            token_count: estimateTokens(content),
          })

        if (userMsgError) {
          console.error('Error saving user message:', userMsgError)
        }

        // Load conversation history
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true })

        const history = messages || []

        // Load custom persona settings if needed
        let customSystemPrompt: string | undefined
        let effectiveTemperature = config.temperature
        let customPersonaSettings: any = null

        if (config.persona === 'custom') {
          const { data: customPersona, error: personaError } = await supabase
            .from('custom_personas')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

          if (customPersona && !personaError) {
            customSystemPrompt = customPersona.system_prompt
            customPersonaSettings = customPersona
            // Use custom persona's default temperature if not explicitly overridden
            // The temperature slider still works and overrides the default
            effectiveTemperature = config.temperature ?? customPersona.temperature_default
          }
        }

        // Assemble prompt
        const llmMessages = assemblePrompt({
          persona: config.persona,
          conversationHistory: history,
          userPrompt: content,
          customSystemPrompt,
        })

        // Get LLM provider
        const provider = getProvider(config.model)

        // Prepare LLM options with custom persona settings if available
        const llmOptions: any = {
          messages: llmMessages,
          temperature: effectiveTemperature,
        }

        // Apply advanced tuning parameters from custom persona if available
        if (customPersonaSettings) {
          if (customPersonaSettings.max_tokens) {
            llmOptions.max_tokens = customPersonaSettings.max_tokens
          }
          if (customPersonaSettings.top_p !== null && customPersonaSettings.top_p !== undefined) {
            llmOptions.top_p = customPersonaSettings.top_p
          }
          if (customPersonaSettings.frequency_penalty !== null && customPersonaSettings.frequency_penalty !== undefined) {
            llmOptions.frequency_penalty = customPersonaSettings.frequency_penalty
          }
          if (customPersonaSettings.presence_penalty !== null && customPersonaSettings.presence_penalty !== undefined) {
            llmOptions.presence_penalty = customPersonaSettings.presence_penalty
          }
        }

        // Stream response
        let fullResponse = ''

        if (provider.streamChat) {
          for await (const chunk of provider.streamChat(llmOptions)) {
            fullResponse += chunk

            // Send chunk to client
            const data = JSON.stringify({ delta: chunk })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        } else {
          // Fallback to non-streaming
          const response = await provider.chat(llmOptions)
          fullResponse = response.content

          const data = JSON.stringify({ delta: response.content })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        // Save assistant message
        await supabase.from('messages').insert({
          thread_id: threadId,
          role: 'assistant',
          content: fullResponse,
          model_used: config.model,
          token_count: estimateTokens(fullResponse),
        })

        // Update thread updated_at and title (if first message)
        if (history.length === 0) {
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
          await supabase
            .from('chat_threads')
            .update({ 
              title, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', threadId)
        } else {
          await supabase
            .from('chat_threads')
            .update({ 
              updated_at: new Date().toISOString() 
            })
            .eq('id', threadId)
        }

        // Send done signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
        
      } catch (error: any) {
        console.error('Chat send error:', error)
        const errorData = JSON.stringify({ error: error.message })
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
