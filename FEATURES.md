# New Features - Web Search & Auto-Naming

## 1. Web Search Integration (Tavily)

### Overview
Users can now search the web directly from the chat interface and include search results in their messages for better AI responses.

### Setup Required
1. **Get Tavily API Key**:
   - Sign up at https://tavily.com
   - Get your API key from the dashboard
   - Free tier: 1,000 searches/month

2. **Add to Vercel Environment Variables**:
   ```bash
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

### How to Use
1. Click the "🔍 Web Search" button in the chat input area
2. Enter your search query
3. Click "Search" to fetch results
4. Review the quick answer and source results
5. Click "Include Results in Message" to add them to your input
6. Send your message with the search context

### Features
- AI-generated quick answers
- Top 5 relevant search results
- Full source URLs for verification
- Formatted results for LLM context
- Clean, easy-to-read interface

### Cost
- Free tier: 1,000 searches/month
- Cost per search after free tier: ~$0.002
- Very affordable for most use cases

---

## 2. Auto-Name Conversations

### Overview
Conversations are automatically given meaningful, descriptive titles after the 3rd message, making it easier to find and organize your chat history.

### How It Works
1. **First Message**: Uses simple truncation (first 60 characters)
2. **After 3rd Message**: Automatically generates a smart title using AI
   - Analyzes first 3 messages for context
   - Creates a 3-5 word descriptive title
   - Updates the thread title automatically

### Examples
- "New Conversation" → "React hooks best practices"
- "New Chat" → "Python data visualization tips"
- "" → "Web scraping with BeautifulSoup"

### Cost
- Uses GPT-4o-mini for cost efficiency
- ~$0.00004 per title (essentially free)
- Happens automatically, no user action needed

### Technical Details
- Triggered when: `messageCount === 3` and title is still default
- Max tokens: 20 (ensures brief titles)
- Temperature: 0.7 (balanced creativity)
- Fallback: "New Conversation" if generation fails

---

## Testing Checklist

### Web Search
- [ ] Click "🔍 Web Search" button
- [ ] Search for: "latest AI trends 2026"
- [ ] Verify results appear with quick answer
- [ ] Click "Include Results in Message"
- [ ] Verify results are added to message input
- [ ] Send message and check AI uses search context
- [ ] Verify TAVILY_API_KEY is set in Vercel

### Auto-Naming
- [ ] Create new conversation
- [ ] Send 1st message - verify truncated title appears
- [ ] Send 2nd message - verify title stays same
- [ ] Send 3rd message - verify auto-generated title appears
- [ ] Check console logs for "[AutoNaming]" messages
- [ ] Verify title is 3-5 words and descriptive

---

## Implementation Files

### Web Search
- `lib/tools/webSearch.ts` - Tavily API integration
- `app/api/search/web/route.ts` - Web search API endpoint
- `components/chat/WebSearchModal.tsx` - Search UI modal
- `components/chat/PromptInput.tsx` - Added search button

### Auto-Naming
- `lib/utils/autoNaming.ts` - Title generation logic
- `app/api/chat/send/route.ts` - Integrated auto-naming

---

## Environment Variables Required

```bash
# Required for web search
TAVILY_API_KEY=your_tavily_api_key_here

# Already configured (for auto-naming)
OPENAI_API_KEY=your_openai_api_key_here
```

---

## Next Steps

1. **Deploy to Vercel**:
   - Add `TAVILY_API_KEY` to environment variables
   - Redeploy the application

2. **Test Features**:
   - Use the testing checklist above
   - Verify both features work in production

3. **Monitor Usage**:
   - Check Tavily dashboard for search usage
   - Monitor OpenAI costs for auto-naming (should be negligible)

---

## Future Enhancements (Planned)

- File upload system (Excel, CSV, PDF, images, docs)
- Razorpay payment gateway integration
- Token-based billing (free tier: 3000 tokens)
- External MCP integration (oCRM)
