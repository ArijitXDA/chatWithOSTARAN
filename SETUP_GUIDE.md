# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Supabase**
   - Create account at supabase.com
   - Create new project
   - Run SUPABASE_SCHEMA.sql in SQL Editor
   - Copy URL and keys to .env.local

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Remaining Files to Create

Due to file size, the following files need to be created manually.
Full code is available in the documentation provided.

### Auth Components (components/auth/)
- SignupForm.tsx
- LoginForm.tsx
- ResetPasswordForm.tsx
- UpdatePasswordForm.tsx

### Chat Components (components/chat/)
- ChatInterface.tsx
- MessageList.tsx
- Message.tsx
- PromptInput.tsx
- ModelSelector.tsx
- PersonaSelector.tsx
- TemperatureControl.tsx
- ThreadSidebar.tsx
- WelcomeScreen.tsx

### UI Components (components/ui/)
- Button.tsx
- Input.tsx
- Select.tsx
- Slider.tsx
- LoadingSpinner.tsx

### API Routes (app/api/)
- chat/send/route.ts
- threads/list/route.ts
- threads/create/route.ts
- threads/[id]/route.ts
- threads/[id]/messages/route.ts
- models/available/route.ts

### Auth Pages (app/auth/)
- login/page.tsx
- signup/page.tsx
- reset-password/page.tsx
- update-password/page.tsx
- callback/route.ts

### Chat Page (app/chat/)
- page.tsx
- layout.tsx

See the comprehensive documentation for complete implementation.
