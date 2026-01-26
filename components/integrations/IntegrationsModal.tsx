/**
 * MCP Integrations Modal - Owner Dashboard Only
 * Manages connection to external MCP servers (CRM)
 */

"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface MCPTool {
  name: string
  description: string
}

interface IntegrationsModalProps {
  onClose: () => void
  userEmail: string
}

export function IntegrationsModal({ onClose, userEmail }: IntegrationsModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [tools, setTools] = useState<MCPTool[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/mcp/status')
      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.connected)
        if (data.connected && data.tools) {
          setTools(data.tools)
        }
      }
    } catch (error) {
      console.error('[MCP] Failed to check status:', error)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to connect')
      }

      const data = await response.json()
      setIsConnected(true)
      setTools(data.tools || [])
      toast.success('Connected to CRM MCP server')
    } catch (error: any) {
      console.error('[MCP] Connection failed:', error)
      setError(error.message)
      toast.error(error.message || 'Failed to connect to MCP server')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/mcp/disconnect', {
        method: 'POST',
      })

      if (response.ok) {
        setIsConnected(false)
        setTools([])
        toast.success('Disconnected from CRM MCP server')
      }
    } catch (error) {
      console.error('[MCP] Disconnect failed:', error)
      toast.error('Failed to disconnect')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🔌 Integrations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage external system connections
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* CRM MCP Server */}
          <div className="border rounded-lg p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  📊 CRM MCP Server
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Connect to your CRM system via Model Context Protocol
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Server: <code className="bg-gray-100 px-2 py-1 rounded">
                    https://mcp-ocrm2.onrender.com
                  </code>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  User: <code className="bg-gray-100 px-2 py-1 rounded">
                    {userEmail}
                  </code>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                {isConnected ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    Disconnected
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                ⚠️ {error}
              </div>
            )}

            {/* Connection Button */}
            <div className="mb-4">
              {isConnected ? (
                <Button
                  onClick={handleDisconnect}
                  variant="secondary"
                  className="w-full"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect to CRM'}
                </Button>
              )}
            </div>

            {/* Available Tools */}
            {isConnected && tools.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Available Tools ({tools.length})
                </h4>
                <div className="space-y-2">
                  {tools.map((tool, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="text-blue-600 text-lg">🔧</div>
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold text-gray-900">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {tool.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tools Info when not connected */}
            {!isConnected && (
              <div className="text-sm text-gray-600">
                <p className="font-semibold mb-2">Available CRM Tools:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>search_leads - Search and filter CRM leads</li>
                  <li>get_lead - Get detailed lead information</li>
                  <li>update_lead - Update lead status and details</li>
                  <li>add_interaction - Log customer interactions</li>
                  <li>get_analytics - Retrieve CRM analytics</li>
                  <li>bulk_operations - Perform bulk CRM operations</li>
                </ul>
              </div>
            )}
          </div>

          {/* Usage Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              💡 How to Use
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Connect to enable CRM tools in your conversations</li>
              <li>oStaran will automatically use CRM data when relevant</li>
              <li>Ask questions like "Show my leads" or "Update lead status"</li>
              <li>All actions are scoped to your CRM permissions</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <Button onClick={onClose} variant="secondary" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
