// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Create group (trigger will automatically add creator as member)
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        creator_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating group:', error)
      return NextResponse.json({
        error: 'Failed to create group',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ group })
  } catch (error: any) {
    console.error('Group creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
