// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Error loading threads:', error)
    return NextResponse.json(
      { error: 'Failed to load threads' },
      { status: 500 }
    )
  }
}
