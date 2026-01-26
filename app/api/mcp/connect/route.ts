/**
 * MCP Connect API
 * Establish connection to MCP server
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { initializeMCP, getMCPManager, getMCPTools } from '@/lib/mcp'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    console.log('[MCP Connect] Initializing MCP for user:', userEmail)

    // Initialize MCP if not already done
    await initializeMCP()

    // Get MCP manager
    const mcpManager = getMCPManager()

    if (!mcpManager) {
      return NextResponse.json(
        { error: 'MCP manager not initialized' },
        { status: 500 }
      )
    }

    // Check if already connected
    const crmClient = mcpManager.getClient('CRM')
    if (crmClient?.isConnected()) {
      console.log('[MCP Connect] Already connected')
      const tools = getMCPTools()
      return NextResponse.json({
        connected: true,
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
        })),
      })
    }

    // Try to connect
    try {
      if (crmClient) {
        await crmClient.connect()
      }

      const tools = getMCPTools()

      console.log('[MCP Connect] Successfully connected, tools:', tools.length)

      return NextResponse.json({
        connected: true,
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
        })),
      })
    } catch (connectError: any) {
      console.error('[MCP Connect] Connection failed:', connectError)
      return NextResponse.json(
        { error: `Failed to connect to CRM: ${connectError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[MCP Connect] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect to MCP server' },
      { status: 500 }
    )
  }
}
