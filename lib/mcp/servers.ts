/**
 * MCP Server Registry
 * Configure external MCP servers here
 * Supports both stdio (local) and HTTP (production) transports
 */

import { MCPServer } from './client'

/**
 * CRM MCP Server Configuration
 *
 * Uses Supabase for data storage and authentication
 *
 * Transport Selection:
 * - Local Development: Uses stdio transport with local server
 * - Production (Vercel): Uses HTTP/SSE transport with deployed server
 *
 * Environment Variables:
 * - CRM_MCP_TRANSPORT: 'stdio' or 'http' (auto-detected if not set)
 *
 * For stdio (local):
 * - CRM_MCP_SERVER_PATH: Path to the built MCP server
 * - CRM_MCP_USER_EMAIL: User email for CRM access
 * - CRM_SUPABASE_URL: Supabase project URL
 * - CRM_SUPABASE_KEY: Supabase anon/service key
 *
 * For HTTP (production):
 * - CRM_MCP_HTTP_URL: HTTP endpoint of deployed CRM MCP server
 * - CRM_MCP_HTTP_HEADERS: Optional JSON string of headers
 */

function getCRMServerConfig(): MCPServer | null {
  // Determine transport type
  const transport = process.env.CRM_MCP_TRANSPORT ||
    (process.env.CRM_MCP_HTTP_URL || process.env.NEXT_PUBLIC_MCP_SERVER_URL ? 'http' : 'stdio')

  if (transport === 'http') {
    // HTTP/SSE transport for production
    const baseUrl = process.env.CRM_MCP_HTTP_URL || process.env.NEXT_PUBLIC_MCP_SERVER_URL

    if (!baseUrl) {
      console.warn('[MCP] No HTTP URL configured for CRM')
      return null
    }

    // Use /sse endpoint for SSE transport
    const url = baseUrl.endsWith('/sse') ? baseUrl : `${baseUrl}/sse`

    const headers: Record<string, string> = {}

    // Parse headers from env if provided
    if (process.env.CRM_MCP_HTTP_HEADERS) {
      try {
        Object.assign(headers, JSON.parse(process.env.CRM_MCP_HTTP_HEADERS))
      } catch (error) {
        console.error('[MCP] Failed to parse CRM_MCP_HTTP_HEADERS:', error)
      }
    }

    console.log('[MCP] Using HTTP transport for CRM:', url)

    return {
      name: 'CRM',
      transport: 'http',
      url,
      headers,
    }
  } else {
    // stdio transport for local development
    const serverPath = process.env.CRM_MCP_SERVER_PATH

    if (!serverPath) {
      console.warn('[MCP] CRM_MCP_SERVER_PATH not configured for stdio transport')
      return null
    }

    return {
      name: 'CRM',
      transport: 'stdio',
      command: 'node',
      args: [serverPath],
      env: {
        CRM_MCP_USER_EMAIL: process.env.CRM_MCP_USER_EMAIL || '',
        CRM_SUPABASE_URL: process.env.CRM_SUPABASE_URL || '',
        CRM_SUPABASE_KEY: process.env.CRM_SUPABASE_KEY || '',
      },
    }
  }
}

export const MCP_SERVERS: Record<string, MCPServer | null> = {
  CRM: getCRMServerConfig(),
}

/**
 * Get enabled MCP servers based on environment configuration
 */
export function getEnabledServers(): Record<string, MCPServer> {
  const enabled: Record<string, MCPServer> = {}

  // Check if CRM is enabled and configured
  if (process.env.ENABLE_CRM_MCP === 'true' && MCP_SERVERS.CRM) {
    enabled.CRM = MCP_SERVERS.CRM
  }

  return enabled
}
