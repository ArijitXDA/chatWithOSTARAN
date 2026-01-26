/**
 * MCP Server Registry
 * Configure external MCP servers here
 */

import { MCPServer } from './client'

/**
 * oCRM MCP Server Configuration
 *
 * IMPORTANT: Update these values based on your oCRM setup:
 * - For local development: use the oCRM project path
 * - For production: use the deployed oCRM MCP server endpoint
 */
export const MCP_SERVERS: Record<string, MCPServer> = {
  oCRM: {
    name: 'oCRM',
    command: 'node',
    args: [
      // TODO: Update this path to your oCRM MCP server entry point
      // Example: '/path/to/oCRM/dist/mcp/server.js'
      process.env.OCRM_MCP_SERVER_PATH || '/tmp/oCRM/dist/mcp/server.js',
    ],
    env: {
      // Pass any required environment variables to the oCRM server
      OCRM_DATABASE_URL: process.env.OCRM_DATABASE_URL || '',
      OCRM_API_KEY: process.env.OCRM_API_KEY || '',
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

  // Check if oCRM is enabled
  if (process.env.ENABLE_OCRM_MCP === 'true' || process.env.OCRM_MCP_SERVER_PATH) {
    enabled.oCRM = MCP_SERVERS.oCRM
  }

  return enabled
}
