// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/llm/factory'
import { assemblePrompt } from '@/lib/utils/prompts'
import { estimateTokens } from '@/lib/utils/token-counter'
import { generateThreadTitle, shouldAutoName } from '@/lib/utils/autoNaming'

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

        if (config.persona === 'custom' && thread.custom_persona_id) {
          const { data: customPersona, error: personaError } = await supabase
            .from('custom_personas')
            .select('*')
            .eq('id', thread.custom_persona_id)
            .eq('user_id', user.id)
            .eq('is_active', true)
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

        // Update thread title
        if (history.length === 0) {
          // First message: use simple truncation
          const cleanContent = content.replace(/\n/g, ' ').trim()
          const title = cleanContent.length > 60
            ? cleanContent.slice(0, 60) + '...'
            : cleanContent || 'New Conversation'

          await supabase
            .from('chat_threads')
            .update({
              title,
              updated_at: new Date().toISOString()
            })
            .eq('id', threadId)
        } else if (shouldAutoName(history.length + 2, thread.title)) {
          // After 3rd message (2 in history + 2 just added): auto-generate title
          console.log('[AutoNaming] Generating title for thread:', threadId)
          try {
            // Get all messages including the ones we just added
            const { data: allMessages } = await supabase
              .from('messages')
              .select('role, content')
              .eq('thread_id', threadId)
              .order('created_at', { ascending: true })
              .limit(3)

            if (allMessages && allMessages.length >= 3) {
              const generatedTitle = await generateThreadTitle(allMessages)

              await supabase
                .from('chat_threads')
                .update({
                  title: generatedTitle,
                  updated_at: new Date().toISOString()
                })
                .eq('id', threadId)

              console.log('[AutoNaming] Updated title to:', generatedTitle)
            }
          } catch (error) {
            console.error('[AutoNaming] Failed to generate title:', error)
            // Continue even if auto-naming fails
            await supabase
              .from('chat_threads')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', threadId)
          }
        } else {
          // Just update timestamp
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
