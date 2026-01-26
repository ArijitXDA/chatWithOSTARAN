/**
 * MCP Server Registry
 * Configure external MCP servers here
 */

import { MCPServer } from './client'

/**
 * CRM MCP Server Configuration
 *
 * Uses Supabase for data storage and authentication
 * Configure via environment variables:
 * - CRM_MCP_SERVER_PATH: Path to the built MCP server
 * - CRM_MCP_USER_EMAIL: User email for CRM access
 * - CRM_SUPABASE_URL: Supabase project URL
 * - CRM_SUPABASE_KEY: Supabase anon/service key
 */
export const MCP_SERVERS: Record<string, MCPServer> = {
  CRM: {
    name: 'CRM',
    command: 'node',
    args: [
      process.env.CRM_MCP_SERVER_PATH || '/home/user/oStaran/crm-mcp-server/dist/mcp/server.js',
    ],
    env: {
      // Supabase configuration for CRM
      CRM_MCP_USER_EMAIL: process.env.CRM_MCP_USER_EMAIL || '',
      CRM_SUPABASE_URL: process.env.CRM_SUPABASE_URL || '',
      CRM_SUPABASE_KEY: process.env.CRM_SUPABASE_KEY || '',
    },
  },
  // Add more MCP servers here as needed
  // Example:
  // anotherServer: {
  //   name: 'Another Server',
  //   command: 'node',
  //   args: ['/path/to/server.js'],
  // },
}

/**
 * Get enabled MCP servers based on environment configuration
 */
export function getEnabledServers(): Record<string, MCPServer> {
  const enabled: Record<string, MCPServer> = {}

  // Check if CRM is enabled
  if (process.env.ENABLE_CRM_MCP === 'true' || process.env.CRM_MCP_SERVER_PATH) {
    enabled.CRM = MCP_SERVERS.CRM
  }

  return enabled
}
