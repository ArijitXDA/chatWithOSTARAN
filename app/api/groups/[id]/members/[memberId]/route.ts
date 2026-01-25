// @ts-nocheck
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE - Remove a member from the group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: groupId, memberId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the member record to check permissions
    const { data: memberToRemove } = await supabase
      .from('group_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('group_id', groupId)
      .single()

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if current user is the creator or removing themselves
    const { data: currentMember } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    const isCreator = currentMember?.role === 'creator'
    const isRemovingSelf = memberToRemove.user_id === user.id

    if (!isCreator && !isRemovingSelf) {
      return NextResponse.json(
        { error: 'Only the creator can remove members' },
        { status: 403 }
      )
    }

    // Don't allow creator to remove themselves (they should delete the group instead)
    if (isRemovingSelf && isCreator) {
      return NextResponse.json(
        { error: 'Creator cannot leave the group. Delete the group instead.' },
        { status: 400 }
      )
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    // Remove the member
    const { error: deleteError } = await serviceClient
      .from('group_members')
      .delete()
      .eq('id', memberId)
      .eq('group_id', groupId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Member DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
