import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')

  if (!token_hash || !type) {
    return NextResponse.redirect(`${url.origin}/auth/login`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    type: type as any,
    token_hash,
  })

  if (error) {
    return NextResponse.redirect(
      `${url.origin}/auth/login?error=${encodeURIComponent(error.message)}`
    )
  }

  // 🔑 Redirect based on flow
  if (type === 'recovery') {
    return NextResponse.redirect(`${url.origin}/auth/update-password`)
  }

  return NextResponse.redirect(`${url.origin}/chat`)
}
