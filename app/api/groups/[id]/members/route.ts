// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch group members
export async function GET(
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

    // Verify user is a member
    const { data: userMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!userMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Get all group members
    const { data: members, error } = await supabase
      .from('group_members')
      .select('id, user_id, role, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json({ error: 'Failed to load members' }, { status: 500 })
    }

    // Get profiles for members
    const userIds = members.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds)

    // Combine member info with profile data
    const membersWithProfiles = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id)
      return {
        ...member,
        name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        email: profile?.email,
      }
    })

    return NextResponse.json({ members: membersWithProfiles })
  } catch (error: any) {
    console.error('Group members GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
