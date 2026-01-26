/**
 * MCP (Model Context Protocol) Client for CRM Integration
 * Supports both stdio (local) and HTTP/SSE (production) transports
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

export interface MCPTool {
  name: string
  description: string
  inputSchema: any
}

export type MCPTransportType = 'stdio' | 'http'

export interface MCPServerStdio {
  name: string
  transport: 'stdio'
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface MCPServerHTTP {
  name: string
  transport: 'http'
  url: string
  headers?: Record<string, string>
}

export type MCPServer = MCPServerStdio | MCPServerHTTP

export class MCPClient {
  private client: Client | null = null
  private transport: StdioClientTransport | SSEClientTransport | null = null
  private tools: Map<string, MCPTool> = new Map()
  private connected: boolean = false

  constructor(private serverConfig: MCPServer) {}

  /**
   * Connect to the MCP server using the configured transport
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return
    }

    try {
      if (this.serverConfig.transport === 'stdio') {
        await this.connectStdio(this.serverConfig)
      } else {
        await this.connectHTTP(this.serverConfig)
      }

      // Create client
      this.client = new Client(
        {
          name: 'oStaran-AI-Agent',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      )

      // Connect
      await this.client.connect(this.transport!)

      // List available tools
      await this.refreshTools()

      this.connected = true
      console.log(`[MCP] Connected to ${this.serverConfig.name} via ${this.serverConfig.transport}`)
      console.log(`[MCP] Available tools:`, Array.from(this.tools.keys()))
    } catch (error) {
      console.error(`[MCP] Failed to connect to ${this.serverConfig.name}:`, error)
      throw error
    }
  }

  /**
   * Connect via stdio transport (local development)
   */
  private async connectStdio(config: MCPServerStdio): Promise<void> {
    // Build environment variables (filter undefined values)
    const env: Record<string, string> = {}
    if (process.env) {
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          env[key] = value
        }
      }
    }
    // Add server-specific env vars
    for (const [key, value] of Object.entries(config.env || {})) {
      env[key] = value
    }

    // Create stdio transport
    this.transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env,
    })

    console.log(`[MCP] Using stdio transport: ${config.command} ${config.args?.join(' ') || ''}`)
  }

  /**
   * Connect via HTTP/SSE transport (production)
   */
  private async connectHTTP(config: MCPServerHTTP): Promise<void> {
    console.log(`[MCP] Using HTTP/SSE transport: ${config.url}`)

    // Create SSE transport
    // Note: Headers can be passed via EventSource options if needed
    this.transport = new SSEClientTransport(new URL(config.url))
  }

  /**
   * Refresh the list of available tools from the server
   */
  async refreshTools(): Promise<void> {
    if (!this.client) {
      throw new Error('MCP client not connected')
    }

    try {
      const result = await this.client.listTools()

      this.tools.clear()
      for (const tool of result.tools) {
        this.tools.set(tool.name, {
          name: tool.name,
          description: tool.description || '',
          inputSchema: tool.inputSchema,
        })
      }

      console.log(`[MCP] Refreshed tools: ${this.tools.size} available`)
    } catch (error) {
      console.error('[MCP] Failed to refresh tools:', error)
      throw error
    }
  }

  /**
   * Get all available tools
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: any): Promise<any> {
    if (!this.client) {
      throw new Error('MCP client not connected')
    }

    if (!this.tools.has(name)) {
      throw new Error(`Tool ${name} not found`)
    }

    try {
      console.log(`[MCP] Calling tool: ${name}`, args)
      const result = await this.client.callTool({
        name,
        arguments: args,
      })

      console.log(`[MCP] Tool result:`, result)
      return result
    } catch (error) {
      console.error(`[MCP] Tool call failed:`, error)
      throw error
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
    }

    if (this.transport) {
      await this.transport.close()
      this.transport = null
    }

    this.connected = false
    console.log(`[MCP] Disconnected from ${this.serverConfig.name}`)
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected
  }
}

/**
 * MCP Manager - manages multiple MCP server connections
 */
export class MCPManager {
  private clients: Map<string, MCPClient> = new Map()

  /**
   * Add an MCP server
   */
  addServer(name: string, config: MCPServer): void {
    const client = new MCPClient(config)
    this.clients.set(name, client)
  }

  /**
   * Connect to all servers
   */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.clients.entries()).map(
      async ([name, client]) => {
        try {
          await client.connect()
        } catch (error) {
          console.error(`[MCP] Failed to connect to ${name}:`, error)
        }
      }
    )

    await Promise.all(promises)
  }

  /**
   * Get all available tools from all servers
   */
  getAllTools(): Array<MCPTool & { serverName: string }> {
    const allTools: Array<MCPTool & { serverName: string }> = []

    for (const [serverName, client] of this.clients.entries()) {
      if (client.isConnected()) {
        const tools = client.getTools()
        for (const tool of tools) {
          allTools.push({
            ...tool,
            serverName,
          })
        }
      }
    }

    return allTools
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverName)

    if (!client) {
      throw new Error(`Server ${serverName} not found`)
    }

    if (!client.isConnected()) {
      throw new Error(`Server ${serverName} not connected`)
    }

    return client.callTool(toolName, args)
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.values()).map((client) =>
      client.disconnect()
    )

    await Promise.all(promises)
  }

  /**
   * Get client for a specific server
   */
  getClient(name: string): MCPClient | undefined {
    return this.clients.get(name)
  }
}
