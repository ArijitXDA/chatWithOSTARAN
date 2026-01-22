// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH - Toggle favorite status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { is_favorite } = await request.json()

    const { data: thread, error } = await supabase
      .from('chat_threads')
      .update({ is_favorite })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling favorite:', error)
      return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 })
    }

    return NextResponse.json({ thread })
  } catch (error: any) {
    console.error('Favorite toggle error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
