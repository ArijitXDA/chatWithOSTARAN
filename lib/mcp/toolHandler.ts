/**
 * MCP Tool Execution Handler
 * Handles tool calling workflow between LLM and MCP servers
 */

import { LLMProvider, LLMMessage, LLMChatParams, LLMChatResponse } from '../llm/types'
import { getMCPTools, callMCPTool, parseToolCall, formatToolsForLLM } from './index'

export interface ToolExecutionResult {
  response: string
  toolCalls: number
  toolsUsed: string[]
}

/**
 * Execute a chat with MCP tool support
 * Handles the full tool calling workflow:
 * 1. Pass available MCP tools to LLM
 * 2. If LLM wants to call a tool, execute it
 * 3. Return tool result to LLM
 * 4. Get final response
 */
export async function chatWithTools(
  provider: LLMProvider,
  messages: LLMMessage[],
  params: Omit<LLMChatParams, 'messages' | 'tools'>
): Promise<ToolExecutionResult> {
  const toolsUsed: string[] = []
  let toolCallCount = 0

  // Check if provider supports tools
  if (!provider.supportsTools) {
    console.log('[MCP Tools] Provider does not support tools, calling without tools')
    const response = await provider.chat({
      ...params,
      messages,
    })
    return {
      response: response.content,
      toolCalls: 0,
      toolsUsed: [],
    }
  }

  // Get available MCP tools
  const mcpTools = getMCPTools()

  if (mcpTools.length === 0) {
    console.log('[MCP Tools] No MCP tools available, calling without tools')
    const response = await provider.chat({
      ...params,
      messages,
    })
    return {
      response: response.content,
      toolCalls: 0,
      toolsUsed: [],
    }
  }

  // Format tools for LLM
  const tools = formatToolsForLLM()
  console.log(`[MCP Tools] Calling LLM with ${tools.length} available tools`)

  // Conversation messages (mutable)
  const conversationMessages: LLMMessage[] = [...messages]

  // Maximum tool call iterations to prevent infinite loops
  const MAX_ITERATIONS = 5
  let iteration = 0

  while (iteration < MAX_ITERATIONS) {
    iteration++

    // Call LLM with tools
    const response: LLMChatResponse = await provider.chat({
      ...params,
      messages: conversationMessages,
      tools,
      tool_choice: 'auto',
    })

    // Check if LLM wants to call tools
    if (response.finish_reason === 'tool_calls' && response.tool_calls) {
      console.log(`[MCP Tools] LLM requested ${response.tool_calls.length} tool calls`)

      // Add assistant message with tool calls to conversation
      conversationMessages.push({
        role: 'assistant',
        content: response.content || '',
        tool_calls: response.tool_calls,
      })

      // Execute each tool call
      for (const toolCall of response.tool_calls) {
        toolCallCount++

        try {
          const { serverName, toolName } = parseToolCall(toolCall.function.name)
          const args = JSON.parse(toolCall.function.arguments)

          console.log(
            `[MCP Tools] Executing: ${serverName}.${toolName}`,
            args
          )

          // Execute the tool via MCP
          const result = await callMCPTool(serverName, toolName, args)

          toolsUsed.push(`${serverName}.${toolName}`)

          // Add tool result to conversation
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(result),
          })

          console.log(`[MCP Tools] Tool result:`, result)
        } catch (error: any) {
          console.error(`[MCP Tools] Tool execution failed:`, error)

          // Add error result to conversation
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify({
              error: error.message || 'Tool execution failed',
            }),
          })
        }
      }

      // Continue loop to get final response from LLM
      continue
    }

    // No more tool calls, return final response
    console.log(
      `[MCP Tools] Conversation complete. Tools used: ${toolsUsed.length}`
    )

    return {
      response: response.content,
      toolCalls: toolCallCount,
      toolsUsed,
    }
  }

  // Max iterations reached
  console.warn('[MCP Tools] Max iterations reached, returning last response')

  return {
    response: conversationMessages[conversationMessages.length - 1]?.content || '',
    toolCalls: toolCallCount,
    toolsUsed,
  }
}

/**
 * Check if MCP tools are available
 */
export function areMCPToolsAvailable(): boolean {
  const tools = getMCPTools()
  return tools.length > 0
}

/**
 * Get available tool names
 */
export function getAvailableToolNames(): string[] {
  const tools = getMCPTools()
  return tools.map((t) => `${t.serverName}.${t.name}`)
}
