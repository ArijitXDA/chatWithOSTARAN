/**
 * MCP Disconnect API
 * Disconnect from MCP server
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMCPManager } from '@/lib/mcp'

export async function POST() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[MCP Disconnect] Disconnecting from MCP servers')

    // Get MCP manager
    const mcpManager = getMCPManager()

    if (!mcpManager) {
      return NextResponse.json({ success: true })
    }

    // Disconnect from all servers
    await mcpManager.disconnectAll()

    console.log('[MCP Disconnect] Successfully disconnected')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[MCP Disconnect] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect from MCP server' },
      { status: 500 }
    )
  }
}
