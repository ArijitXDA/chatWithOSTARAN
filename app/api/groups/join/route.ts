// @ts-nocheck
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteCode } = await request.json()

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    // Use service client to bypass RLS for invite code lookup
    // The invite code itself is the secret that grants access
    const serviceClient = createServiceClient()

    // Find group by invite code (using service client to bypass RLS)
    const { data: group, error: groupError } = await serviceClient
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('is_active', true)
      .single()

    if (groupError || !group) {
      console.error('Group lookup error:', groupError)
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    // Check if user is already a member (using service client)
    const { data: existingMember } = await serviceClient
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ group, alreadyMember: true })
    }

    // Add user as member (using service client to bypass RLS)
    const { error: memberError } = await serviceClient
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      })

    if (memberError) {
      console.error('Error adding member:', memberError)
      return NextResponse.json({
        error: 'Failed to join group',
        details: memberError.message
      }, { status: 500 })
    }

    return NextResponse.json({ group, alreadyMember: false })
  } catch (error: any) {
    console.error('Group join error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
