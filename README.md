# AI Agent Platform

A premium AI chat platform built with Next.js, Supabase, and multiple LLM providers (Claude, OpenAI, Gemini).

## Features

- 🤖 Multiple AI Models (Claude, GPT-4, Gemini)
- 🎭 Smart Personas (Researcher, Professor, Student, Marketing Manager, HR Manager)
- 💬 Conversation Memory & Thread Management
- 📎 **File Upload Support** (Images, PDFs, Excel, Word docs)
- 👁️ **Vision Capabilities** (Image analysis with Claude & GPT-4)
- 📄 **Document Analysis** (Extract and analyze text from PDFs, Word, Excel)
- 🔐 Secure Authentication with Supabase
- 🎨 Premium, ChatGPT-like UI
- 📊 Temperature Control
- 🌊 Streaming Responses
- 🔍 Web Search Integration
- 🛠️ Custom Persona Builder
- 👥 Group Chat Support

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `SUPABASE_SCHEMA.sql` in the SQL Editor
3. Get your project URL and API keys from Settings > API

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Update the following variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `ANTHROPIC_API_KEY` - Your Anthropic API key (for Claude)
- `OPENAI_API_KEY` - Your OpenAI API key (optional)
- `GOOGLE_API_KEY` - Your Google API key (optional, for Gemini)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## Project Structure

```
ai-agent-platform/
├── app/                    # Next.js app router
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── chat/             # Chat components
│   └── ui/               # UI primitives
├── lib/                   # Core logic
│   ├── llm/              # LLM provider abstraction
│   ├── personas/         # Persona definitions
│   ├── supabase/         # Supabase clients
│   └── utils/            # Utilities
├── types/                # TypeScript types
└── hooks/                # React hooks
```

## Architecture Highlights

### Prompt Assembly

The system uses a clear separation of concerns for prompt assembly:

1. **System Prompt** - Includes persona behavior
2. **Conversation History** - For context/memory
3. **User Prompt** - Current user input

### Security

- ✅ All secrets in environment variables
- ✅ Row Level Security (RLS) enabled
- ✅ Frontend uses anon key only
- ✅ Backend uses service role key
- ✅ Never exposes API keys to client

### Teachability

This project is designed for classroom demonstrations:

- Clear, commented code
- Small, focused functions
- Explainable architecture
- No magic or hidden complexity

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **LLM Providers**: Anthropic Claude, OpenAI, Google Gemini
- **Deployment**: Vercel

## License

Private project for AIwithArijit.com and oStaran

## Support

For questions or issues, contact: arijit@ostaran.com
