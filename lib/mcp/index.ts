/**
 * MCP Integration Entry Point
 * Singleton MCP manager for the application
 */

import { MCPManager } from './client'
import { getEnabledServers } from './servers'
import { LLMTool } from '../llm/types'

// Singleton MCP manager instance
let mcpManager: MCPManager | null = null
let initializationPromise: Promise<void> | null = null

/**
 * Initialize the MCP manager with configured servers
 */
export async function initializeMCP(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    if (mcpManager) {
      console.log('[MCP] Already initialized')
      return
    }

    console.log('[MCP] Initializing MCP manager...')

    mcpManager = new MCPManager()

    // Add enabled servers
    const servers = getEnabledServers()

    if (Object.keys(servers).length === 0) {
      console.log('[MCP] No MCP servers configured')
      return
    }

    for (const [name, config] of Object.entries(servers)) {
      mcpManager.addServer(name, config)
      console.log(`[MCP] Added server: ${name}`)
    }

    // Connect to all servers
    try {
      await mcpManager.connectAll()
      console.log('[MCP] Initialization complete')
    } catch (error) {
      console.error('[MCP] Initialization failed:', error)
      // Don't throw - allow app to continue without MCP
    }
  })()

  return initializationPromise
}

/**
 * Get the MCP manager instance
 */
export function getMCPManager(): MCPManager | null {
  return mcpManager
}

/**
 * Get all available MCP tools across all connected servers
 */
export function getMCPTools() {
  if (!mcpManager) {
    return []
  }

  return mcpManager.getAllTools()
}

/**
 * Call an MCP tool
 */
export async function callMCPTool(
  serverName: string,
  toolName: string,
  args: any
): Promise<any> {
  if (!mcpManager) {
    throw new Error('MCP manager not initialized')
  }

  return mcpManager.callTool(serverName, toolName, args)
}

/**
 * Format MCP tools for LLM tool calling
 */
export function formatToolsForLLM(): LLMTool[] {
  const tools = getMCPTools()

  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: `${tool.serverName}_${tool.name}`,
      description: `[${tool.serverName}] ${tool.description}`,
      parameters: tool.inputSchema,
    },
  }))
}

/**
 * Parse tool call from LLM response
 */
export function parseToolCall(toolName: string): {
  serverName: string
  toolName: string
} {
  const [serverName, ...rest] = toolName.split('_')
  const actualToolName = rest.join('_')

  return {
    serverName,
    toolName: actualToolName,
  }
}

/**
 * Cleanup - disconnect all MCP servers
 */
export async function shutdownMCP(): Promise<void> {
  if (mcpManager) {
    console.log('[MCP] Shutting down...')
    await mcpManager.disconnectAll()
    mcpManager = null
    initializationPromise = null
    console.log('[MCP] Shutdown complete')
  }
}

// Initialize MCP on module load (in serverless, this happens on cold start)
if (typeof process !== 'undefined' && process.env.ENABLE_MCP !== 'false') {
  // Don't block on initialization, let it happen in background
  initializeMCP().catch((error) => {
    console.error('[MCP] Background initialization failed:', error)
  })
}

export * from './client'
export * from './servers'
