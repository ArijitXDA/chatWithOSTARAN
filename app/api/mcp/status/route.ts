/**
 * MCP Status API
 * Check if MCP server is connected and list available tools
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMCPManager, getMCPTools } from '@/lib/mcp'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get MCP manager
    const mcpManager = getMCPManager()

    if (!mcpManager) {
      return NextResponse.json({
        connected: false,
        tools: [],
      })
    }

    // Get available tools
    const tools = getMCPTools()

    // Get CRM client status
    const crmClient = mcpManager.getClient('CRM')
    const connected = crmClient?.isConnected() || false

    return NextResponse.json({
      connected,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        serverName: t.serverName,
      })),
    })
  } catch (error: any) {
    console.error('[MCP Status] Error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to check MCP status',
      connected: false,
      tools: [],
    }, { status: 500 })
  }
}
