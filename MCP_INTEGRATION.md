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

### 1. Verify CRM MCP Server is Built

First, ensure that the CRM MCP server is properly built. The MCP server should be in the `crm-mcp-server` submodule.

**Check CRM MCP Server:**
```bash
ls /home/user/oStaran/crm-mcp-server/dist/mcp/server.js
# Should show the built server file
```

If the server isn't built yet:
```bash
cd /home/user/oStaran/crm-mcp-server
npm install
npm run build
```

### 2. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Enable MCP Integration
ENABLE_MCP=true
ENABLE_CRM_MCP=true

# Path to CRM MCP Server
CRM_MCP_SERVER_PATH=/home/user/oStaran/crm-mcp-server/dist/mcp/server.js

# CRM Supabase Configuration
CRM_MCP_USER_EMAIL=your-email@example.com
CRM_SUPABASE_URL=https://your-project.supabase.co
CRM_SUPABASE_KEY=your_supabase_anon_key
```

**Important:**
- Use absolute paths for `CRM_MCP_SERVER_PATH`
- The CRM uses Supabase, not direct PostgreSQL
- `CRM_SUPABASE_KEY` should be your Supabase anon or service key

### 3. Update Vercel Environment Variables (Production)

In your Vercel project settings, add the same environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all the variables above:
   - `ENABLE_MCP=true`
   - `ENABLE_CRM_MCP=true`
   - `CRM_MCP_SERVER_PATH` (use production path)
   - `CRM_MCP_USER_EMAIL`
   - `CRM_SUPABASE_URL`
   - `CRM_SUPABASE_KEY`
3. Redeploy your application

**Note:** For Vercel deployment, ensure the CRM MCP server is accessible from the Vercel environment. You may need to include the `crm-mcp-server` directory in your deployment or deploy it separately.

### 4. Test the Integration

Create a new chat and ask oStaran to interact with CRM:

```
User: "Show me all leads from the past week"
oStaran: [Uses CRM tools to fetch and display leads]

User: "Update the status of lead ID 123 to 'qualified'"
oStaran: [Calls CRM tool to update the lead]

User: "List all my CRM contacts"
oStaran: [Fetches and displays contacts from CRM]
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

## Available CRM Tools

The exact tools depend on your CRM MCP server implementation. Common tools might include:

- `list_leads` - Fetch leads with optional filters
- `get_lead` - Get a specific lead by ID
- `create_lead` - Create a new lead
- `update_lead` - Update lead information
- `list_contacts` - Fetch all contacts
- `search_contacts` - Search for specific contacts
- `get_contact` - Get contact details
- And more...

**Note:** Tool names will be prefixed with the server name in the LLM context (e.g., `CRM_list_leads`).

## Debugging

### Enable Debug Logs

All MCP operations are logged with the `[MCP]` prefix:

```bash
# In your application logs (Vercel or local console), you'll see:
[MCP] Initializing MCP manager...
[MCP] Added server: CRM
[MCP] Connected to CRM
[MCP] Available tools: list_leads, get_lead, update_lead, list_contacts, search_contacts
[MCP Tools] Calling LLM with 5 available tools
[MCP Tools] LLM requested 1 tool calls
[MCP Tools] Executing: CRM.list_leads { status: 'new', limit: 10 }
[MCP Tools] Tool result: { leads: [...] }
[MCP Tools] Conversation complete. Tools used: 1
```

### Check MCP Connection

To verify MCP is working, check the application startup logs for:
```
[MCP] Initializing MCP manager...
[MCP] Added server: CRM
[MCP] Connected to CRM
[MCP] Available tools: list_leads, get_lead, create_lead, update_lead, list_contacts...
[MCP] Initialization complete
```

### Common Issues

**Problem:** "MCP manager not initialized"
**Solution:** Ensure `ENABLE_MCP=true` and `ENABLE_CRM_MCP=true` are set

**Problem:** "Server CRM not found"
**Solution:** Check that `CRM_MCP_SERVER_PATH` points to the correct file

**Problem:** "Failed to connect to CRM"
**Solution:**
- Verify the MCP server file exists: `ls /home/user/oStaran/crm-mcp-server/dist/mcp/server.js`
- Check that dependencies are installed in crm-mcp-server: `cd crm-mcp-server && npm install`
- Verify Supabase credentials are correct (URL and key)
- Check that the user email exists in the CRM Supabase database

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
