// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/llm/factory'
import { assemblePrompt } from '@/lib/utils/prompts'
import { estimateTokens } from '@/lib/utils/token-counter'
import { generateThreadTitle, shouldAutoName } from '@/lib/utils/autoNaming'
import { shouldAutoSearch, extractSearchQuery } from '@/lib/utils/searchDetection'
import { searchWeb, formatSearchResultsForLLM } from '@/lib/tools/webSearch'
import { chatWithTools, areMCPToolsAvailable } from '@/lib/mcp/toolHandler'
import { initializeMCP } from '@/lib/mcp'

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

        const { threadId, content, config, files } = await request.json()

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

        // Save user message and get its ID for file attachments
        const { data: savedMessage, error: userMsgError } = await supabase
          .from('messages')
          .insert({
            thread_id: threadId,
            role: 'user',
            content: content,
            token_count: estimateTokens(content),
          })
          .select()
          .single()

        if (userMsgError || !savedMessage) {
          console.error('Error saving user message:', userMsgError)
          throw new Error('Failed to save user message')
        }

        const messageId = savedMessage.id

        // Process and save file attachments if any
        let fileContext = ''
        if (files && files.length > 0) {
          console.log('[Files] Processing', files.length, 'file(s)', files)

          for (const fileData of files) {
            console.log('[Files] Processing file:', fileData.fileName, 'Category:', fileData.category, 'Has extractedText:', !!fileData.extractedText, 'Text length:', fileData.extractedText?.length)
            try {
              // Save file attachment to database
              const { error: fileError } = await supabase
                .from('file_attachments')
                .insert({
                  message_id: messageId,
                  user_id: user.id,
                  file_name: fileData.fileName,
                  file_type: fileData.fileType,
                  file_size: fileData.fileSize,
                  file_category: fileData.category,
                  storage_path: `${user.id}/${messageId}/${fileData.fileName}`,
                  storage_bucket: 'chat-attachments',
                  extracted_text: fileData.extractedText,
                  width: fileData.width,
                  height: fileData.height,
                  processing_status: 'completed',
                })

              if (fileError) {
                console.error('[Files] Error saving file attachment:', fileError)
              } else {
                // Add file content to context
                if (fileData.category === 'image') {
                  // For images, we'll handle vision later
                  fileContext += `\n\n[Image attached: ${fileData.fileName}]`
                } else if (fileData.extractedText) {
                  // For documents, add extracted text
                  fileContext += `\n\n[Content from ${fileData.fileName}]:\n${fileData.extractedText}\n`
                }
              }
            } catch (error) {
              console.error('[Files] Error processing file:', error)
            }
          }
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

        // Auto web search detection
        let enrichedContent = content
        if (shouldAutoSearch(content)) {
          console.log('[AutoSearch] Detected query needing web search:', content)
          try {
            const searchQuery = extractSearchQuery(content)
            console.log('[AutoSearch] Searching for:', searchQuery)

            const searchResults = await searchWeb(searchQuery, 5)
            const formattedResults = formatSearchResultsForLLM(searchResults)

            // Prepend search results to user content
            enrichedContent = `[I performed a web search to answer your question]\n\n${formattedResults}\n\n---\n\nUser Question: ${content}`

            console.log('[AutoSearch] Successfully enriched context with search results')
          } catch (error) {
            console.error('[AutoSearch] Failed to perform web search:', error)
            // Continue without search results if it fails
          }
        }

        // Add file context to enriched content
        if (fileContext) {
          enrichedContent = `${enrichedContent}\n\n${fileContext}`
        }

        // Assemble prompt
        const llmMessages = assemblePrompt({
          persona: config.persona,
          conversationHistory: history,
          userPrompt: enrichedContent,
          customSystemPrompt,
        })

        // Add vision support: Convert last user message to content blocks if images are present
        if (files && files.length > 0) {
          const imageFiles = files.filter(f => f.category === 'image' && f.base64Data)

          if (imageFiles.length > 0) {
            // Find the last user message (just added by assemblePrompt)
            const lastMessageIndex = llmMessages.length - 1
            const lastMessage = llmMessages[lastMessageIndex]

            if (lastMessage && lastMessage.role === 'user' && typeof lastMessage.content === 'string') {
              // Convert to content blocks format
              const contentBlocks: any[] = []

              // Add text block
              if (lastMessage.content.trim()) {
                contentBlocks.push({
                  type: 'text',
                  text: lastMessage.content
                })
              }

              // Add image blocks
              imageFiles.forEach(img => {
                contentBlocks.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: img.fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                    data: img.base64Data
                  }
                })
              })

              // Replace string content with content blocks
              llmMessages[lastMessageIndex].content = contentBlocks
              console.log(`[Vision] Added ${imageFiles.length} image(s) to message`)
            }
          }
        }

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

        // Check if MCP tools are available and provider supports them
        const useMCPTools = areMCPToolsAvailable() && provider.supportsTools

        let fullResponse = ''
        let toolsUsed: string[] = []

        if (useMCPTools) {
          // Use MCP tool calling (non-streaming)
          console.log('[MCP] Using tool-enabled chat')

          try {
            // Initialize MCP if not already done
            await initializeMCP()

            // Execute chat with tools
            const toolResult = await chatWithTools(provider, llmMessages, {
              temperature: effectiveTemperature,
              maxTokens: llmOptions.max_tokens,
            })

            fullResponse = toolResult.response
            toolsUsed = toolResult.toolsUsed

            // Send complete response to client
            const data = JSON.stringify({ delta: fullResponse })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))

            // Log tool usage
            if (toolResult.toolCalls > 0) {
              console.log(
                `[MCP] Completed with ${toolResult.toolCalls} tool calls:`,
                toolsUsed
              )
            }
          } catch (error) {
            console.error('[MCP] Tool calling failed, falling back to regular chat:', error)
            // Fallback to regular chat
            const response = await provider.chat(llmOptions)
            fullResponse = response.content

            const data = JSON.stringify({ delta: response.content })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        } else if (provider.streamChat) {
          // Regular streaming chat (no tools)
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
        // history.length includes the user message we just saved
        // We just saved the AI message, so total messages = history.length + 1
        const totalMessages = history.length + 1

        console.log('[TitleUpdate] Total messages:', totalMessages, 'Current title:', thread.title)

        if (shouldAutoName(totalMessages, thread.title)) {
          // Auto-generate title after 3rd message
          console.log('[AutoNaming] Triggering for thread:', threadId)
          try {
            // Get first 3 messages for context
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
            } else {
              console.log('[AutoNaming] Not enough messages:', allMessages?.length)
              await supabase
                .from('chat_threads')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', threadId)
            }
          } catch (error) {
            console.error('[AutoNaming] Failed to generate title:', error)
            await supabase
              .from('chat_threads')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', threadId)
          }
        } else {
          // Just update timestamp
          console.log('[TitleUpdate] Not auto-naming. MessageCount:', totalMessages, 'Title:', thread.title)
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
