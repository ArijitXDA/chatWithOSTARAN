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

        // Assemble prompt
        const llmMessages = assemblePrompt({
          persona: config.persona,
          conversationHistory: history,
          userPrompt: content,
        })

        // Get LLM provider
        const provider = getProvider(config.model)

        // Stream response
        let fullResponse = ''

        if (provider.streamChat) {
          for await (const chunk of provider.streamChat({
            messages: llmMessages,
            temperature: config.temperature,
          })) {
            fullResponse += chunk
            
            // Send chunk to client
            const data = JSON.stringify({ delta: chunk })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        } else {
          // Fallback to non-streaming
          const response = await provider.chat({
            messages: llmMessages,
            temperature: config.temperature,
          })
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
