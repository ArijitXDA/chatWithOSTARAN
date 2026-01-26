# MCP Integration Guide - oCRM Connection

This document explains how to integrate oStaran with the oCRM system using the Model Context Protocol (MCP).

## Overview

MCP (Model Context Protocol) allows oStaran to connect to external systems and use their tools. In this integration, oStaran can interact with oCRM to:
- Query leads and customers
- Update CRM records
- Search contacts
- Perform CRM operations through natural conversation

## Architecture

```
┌─────────────┐          ┌──────────────┐          ┌────────────┐
│   oStaran   │  ◄────►  │  MCP Client  │  ◄────►  │ oCRM Server│
│  AI Agent   │   chat   │  (this app)  │   stdio  │ (MCP tools)│
└─────────────┘          └──────────────┘          └────────────┘
```

## Setup Instructions

### 1. Verify oCRM MCP Server is Running

First, ensure that the oCRM MCP server is properly configured in your oCRM project. The MCP server should be built and ready to run.

**Check oCRM Project:**
```bash
cd /path/to/oCRM
ls dist/mcp/server.js  # Verify the MCP server exists
```

### 2. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Enable MCP Integration
ENABLE_MCP=true
ENABLE_OCRM_MCP=true

# Path to oCRM MCP Server
# For local development:
OCRM_MCP_SERVER_PATH=/absolute/path/to/oCRM/dist/mcp/server.js

# oCRM Configuration (passed to MCP server)
OCRM_DATABASE_URL=postgresql://user:pass@localhost:5432/ocrm
OCRM_API_KEY=your_ocrm_api_key_here
```

**Important:** Use absolute paths for `OCRM_MCP_SERVER_PATH`.

### 3. Update Vercel Environment Variables (Production)

In your Vercel project settings, add the same environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all the variables above
3. Redeploy your application

**Note:** For production, you may need to deploy the oCRM MCP server separately and update the connection method (e.g., HTTP/SSE instead of stdio).

### 4. Test the Integration

Create a new chat and ask oStaran to interact with oCRM:

```
User: "Show me all leads from the past week"
oStaran: [Uses oCRM tools to fetch and display leads]

User: "Update the status of lead ID 123 to 'qualified'"
oStaran: [Calls oCRM tool to update the lead]
```

## How It Works

### 1. MCP Initialization

When the application starts, the MCP manager:
- Connects to configured MCP servers (oCRM)
- Lists available tools from each server
- Caches tool definitions

### 2. Tool Discovery

When a chat starts, the system:
- Fetches available MCP tools
- Formats them for the LLM
- Passes them as "functions" the AI can call

### 3. Tool Execution

When the LLM wants to use a tool:
1. LLM returns a `tool_call` with tool name and arguments
2. System parses the tool call (e.g., `oCRM_getLeads`)
3. Executes the tool on the appropriate MCP server
4. Returns the result to the LLM
5. LLM generates a natural language response

### 4. Multi-Turn Tool Usage

The system supports multiple tool calls:
- LLM can call multiple tools in one turn
- LLM can call tools across multiple turns
- Maximum 5 iterations to prevent infinite loops

## Available oCRM Tools

The exact tools depend on your oCRM MCP server implementation. Common tools might include:

- `getLeads` - Fetch leads with filters
- `getLead` - Get a specific lead by ID
- `updateLead` - Update lead information
- `searchContacts` - Search for contacts
- `createLead` - Create a new lead
- `getCustomers` - Fetch customers
- And more...

## Debugging

### Enable Debug Logs

All MCP operations are logged with the `[MCP]` prefix:

```bash
# In your application logs, you'll see:
[MCP] Initializing MCP manager...
[MCP] Added server: oCRM
[MCP] Connected to oCRM
[MCP] Available tools: getLeads, updateLead, searchContacts
[MCP Tools] Calling LLM with 3 available tools
[MCP Tools] LLM requested 1 tool calls
[MCP Tools] Executing: oCRM.getLeads { status: 'new' }
[MCP Tools] Tool result: { leads: [...] }
```

### Check MCP Connection

To verify MCP is working, check the application startup logs for:
```
[MCP] Initialization complete
[MCP] Available tools: [list of tools]
```

### Common Issues

**Problem:** "MCP manager not initialized"
**Solution:** Ensure `ENABLE_MCP=true` and `ENABLE_OCRM_MCP=true` are set

**Problem:** "Server oCRM not found"
**Solution:** Check that `OCRM_MCP_SERVER_PATH` points to the correct file

**Problem:** "Failed to connect to oCRM"
**Solution:**
- Verify the MCP server file exists and is executable
- Check that oCRM dependencies are installed
- Verify database credentials are correct

## Architecture Details

### Files Structure

```
lib/mcp/
├── client.ts       # MCP client implementation
├── servers.ts      # MCP server registry/config
├── index.ts        # Main MCP module, singleton manager
└── toolHandler.ts  # Tool execution orchestration
```

### Key Components

**MCPClient:** Manages connection to a single MCP server
- Connects via stdio transport
- Lists available tools
- Executes tool calls

**MCPManager:** Manages multiple MCP server connections
- Singleton instance across the app
- Coordinates multiple servers
- Aggregates tools from all servers

**toolHandler:** Orchestrates tool calling workflow
- Fetches MCP tools
- Passes tools to LLM
- Executes tool calls
- Handles multi-turn conversations

## Extending the Integration

### Adding More MCP Servers

Edit `lib/mcp/servers.ts`:

```typescript
export const MCP_SERVERS: Record<string, MCPServer> = {
  oCRM: { /* ... */ },

  // Add new server
  anotherSystem: {
    name: 'Another System',
    command: 'node',
    args: ['/path/to/server.js'],
    env: {
      API_KEY: process.env.ANOTHER_API_KEY || '',
    },
  },
}
```

Then enable it via environment variable:
```bash
ENABLE_ANOTHER_SYSTEM_MCP=true
```

### Customizing Tool Behavior

You can customize how tools are presented to the LLM by modifying `formatToolsForLLM()` in `lib/mcp/index.ts`.

## Security Considerations

1. **API Keys:** Never commit API keys or database URLs to git
2. **Tool Access:** MCP tools run with full server permissions - validate all tool inputs
3. **Rate Limiting:** Consider adding rate limits for tool calls
4. **Error Handling:** Tool errors are sent back to LLM - don't expose sensitive information

## Performance

- MCP initialization happens on cold start (~1-2 seconds)
- Tool calls add ~500ms-2s per call depending on the operation
- Tools are executed sequentially (not parallel)
- Maximum 5 tool call iterations per conversation turn

## Next Steps

1. ✅ Set up environment variables
2. ✅ Verify oCRM MCP server path
3. ✅ Test with a simple query
4. ✅ Monitor logs for MCP activity
5. ✅ Configure additional MCP servers if needed

## Support

For issues with:
- **MCP Integration:** Check this document and application logs
- **oCRM Tools:** Check oCRM project documentation
- **Tool Execution:** Enable debug logs and check `[MCP Tools]` messages
