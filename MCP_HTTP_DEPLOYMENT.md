# MCP HTTP Deployment Guide

This guide explains how to deploy the CRM MCP server as an HTTP service for production use with Vercel.

## Overview

The MCP integration supports two transport types:
- **stdio** (local development): Runs the CRM server as a child process
- **HTTP/SSE** (production): Connects to a deployed CRM server via HTTP

For Vercel deployment, we use HTTP transport because Vercel's serverless functions don't support long-running stdio processes.

## Architecture

```
┌─────────────┐          ┌──────────────┐          ┌────────────┐
│   oStaran   │  HTTP    │  MCP Client  │  HTTP/   │ CRM Server │
│  (Vercel)   │  ◄────►  │  (oStaran)   │   SSE    │ (Deployed) │
└─────────────┘          └──────────────┘   ◄────► └────────────┘
                                                      (Railway/
                                                       Render/etc)
```

## Step 1: Prepare CRM MCP Server for HTTP

The CRM MCP server needs to expose an HTTP endpoint. You need to modify it to use SSE transport.

### Update CRM Server Entry Point

Create or update `crm-mcp-server/src/http-server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { setupCRMTools } from './tools/index.js'; // Your CRM tools

const app = express();
const PORT = process.env.PORT || 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MCP SSE endpoint
app.post('/mcp', async (req, res) => {
  console.log('[MCP HTTP] New connection');

  // Create MCP server
  const server = new Server(
    {
      name: 'crm-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Setup CRM tools
  await setupCRMTools(server);

  // Create SSE transport
  const transport = new SSEServerTransport('/mcp', res);
  await server.connect(transport);

  console.log('[MCP HTTP] Client connected');
});

app.listen(PORT, () => {
  console.log(`[MCP HTTP] Server listening on port ${PORT}`);
  console.log(`[MCP HTTP] Endpoint: http://localhost:${PORT}/mcp`);
});
```

### Update package.json

Add dependencies and scripts:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.3",
    "express": "^4.18.2"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/http-server.js",
    "dev": "tsx src/http-server.ts"
  }
}
```

## Step 2: Deploy CRM Server

Choose a deployment platform that supports Node.js HTTP servers:

### Option A: Railway (Recommended - Easy)

1. **Push CRM server to GitHub** (if not already):
   ```bash
   cd /path/to/crm-mcp-server
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your CRM repository
   - Railway will auto-detect Node.js and deploy

3. **Set Environment Variables** in Railway:
   ```
   CRM_MCP_USER_EMAIL=ari.bombay@gmail.com
   CRM_SUPABASE_URL=https://enszifyeqnwcnxaqrmrq.supabase.co
   CRM_SUPABASE_KEY=your_supabase_key
   PORT=3001
   ```

4. **Get the deployment URL**:
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Your MCP endpoint will be: `https://your-app.railway.app/mcp`

### Option B: Render

1. **Deploy to Render**:
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Environment: Node

2. **Set Environment Variables** in Render dashboard

3. **Get the URL**: `https://your-app.onrender.com/mcp`

### Option C: Separate Vercel Project

1. **Deploy as separate Vercel project**:
   - Create `api/mcp.ts` serverless function in CRM repo
   - Deploy to Vercel
   - URL: `https://your-crm-app.vercel.app/api/mcp`

**Note**: Vercel has 10-second timeout on Hobby plan, may not be ideal for long-running MCP connections.

## Step 3: Configure oStaran for HTTP Transport

Once your CRM server is deployed, configure oStaran to use it.

### Local Development (.env.local)

Use stdio for local development:

```bash
# Enable MCP
ENABLE_MCP=true
ENABLE_CRM_MCP=true

# Use stdio transport (local)
CRM_MCP_TRANSPORT=stdio
CRM_MCP_SERVER_PATH=/home/user/oStaran/crm-mcp-server/dist/mcp/server.js
CRM_MCP_USER_EMAIL=ari.bombay@gmail.com
CRM_SUPABASE_URL=https://enszifyeqnwcnxaqrmrq.supabase.co
CRM_SUPABASE_KEY=your_key
```

### Production (Vercel Environment Variables)

Use HTTP transport for production:

```bash
# Enable MCP
ENABLE_MCP=true
ENABLE_CRM_MCP=true

# Use HTTP transport (production)
CRM_MCP_TRANSPORT=http
CRM_MCP_HTTP_URL=https://your-crm-app.railway.app/mcp

# Optional: Add custom headers if needed
# CRM_MCP_HTTP_HEADERS={"Authorization":"Bearer your-token"}
```

## Step 4: Test the Integration

### Test CRM Server Health

```bash
curl https://your-crm-app.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Test MCP Endpoint

```bash
curl -X POST https://your-crm-app.railway.app/mcp \
  -H "Content-Type: application/json"
```

Should establish SSE connection (will hang, that's expected).

### Test in oStaran

1. Deploy oStaran to Vercel with HTTP config
2. Check logs for:
   ```
   [MCP] Using HTTP/SSE transport: https://your-crm-app.railway.app/mcp
   [MCP] Connected to CRM via http
   [MCP] Available tools: list_leads, get_lead, ...
   ```

3. Test a query:
   ```
   User: "Show me all my CRM leads"
   oStaran: [Uses CRM_list_leads tool via HTTP]
   ```

## Step 5: Monitor and Debug

### Check CRM Server Logs

- **Railway**: Dashboard → Your Service → Deployments → Logs
- **Render**: Dashboard → Your Service → Logs
- **Vercel**: Dashboard → Your Project → Deployments → Function Logs

Look for:
```
[MCP HTTP] Server listening on port 3001
[MCP HTTP] New connection
[MCP HTTP] Client connected
```

### Check oStaran Logs

In Vercel logs, look for:
```
[MCP] Initializing MCP manager...
[MCP] Added server: CRM
[MCP] Using HTTP/SSE transport: https://...
[MCP] Connected to CRM via http
[MCP] Available tools: ...
```

### Common Issues

**Problem**: "Failed to connect to CRM" with HTTP transport
**Solutions**:
- Verify CRM server is running: `curl https://your-url/health`
- Check CORS headers are set correctly
- Verify CRM_MCP_HTTP_URL is correct
- Check CRM server logs for errors

**Problem**: "Connection timeout"
**Solutions**:
- Increase timeout on hosting platform
- Check for cold start delays
- Verify network connectivity

**Problem**: "Tools not found"
**Solutions**:
- Verify CRM server is exposing tools correctly
- Check CRM server logs for tool registration
- Test MCP endpoint directly

## Cost Estimates

### Railway
- Free tier: $5 credit/month (enough for development)
- Pro: $20/month for production workloads
- Pay-as-you-go after free tier

### Render
- Free tier: Available for hobby projects
- Starter: $7/month
- Standard: $25/month

### Vercel (Separate Project)
- Hobby: Free (10-second timeout limit)
- Pro: $20/month (60-second timeout)

## Recommendation

**For Production**: Use **Railway** or **Render**
- Reliable HTTP servers
- No timeout restrictions
- Easy deployment from GitHub
- Affordable pricing

**For Testing**: You can use Railway's free tier initially

## Next Steps

1. Choose a deployment platform
2. Modify CRM server to expose HTTP endpoint
3. Deploy CRM server
4. Update Vercel environment variables
5. Test the integration
6. Monitor logs and performance

## Security Considerations

1. **Authentication**: Add authentication to CRM HTTP endpoint
2. **CORS**: Configure proper CORS policies
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Environment Variables**: Keep Supabase keys secure
5. **HTTPS**: Always use HTTPS in production
