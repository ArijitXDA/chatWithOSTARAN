// @ts-nocheck
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH - Update group settings
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: groupId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member (any member can update settings)
    const { data: userMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!userMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const { group_persona_id } = await request.json()

    // Use service client to update (bypass RLS)
    const serviceClient = createServiceClient()

    const { data: group, error: updateError } = await serviceClient
      .from('groups')
      .update({ group_persona_id })
      .eq('id', groupId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating group settings:', updateError)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ group })
  } catch (error: any) {
    console.error('Group settings PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
