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

    // Get token counts per member (sum of all their messages' token_count)
    const { data: tokenData } = await supabase
      .from('group_messages')
      .select('user_id, token_count')
      .eq('group_id', groupId)
      .not('token_count', 'is', null)

    // Calculate token counts per user
    const tokensByUser: Record<string, number> = {}
    tokenData?.forEach((msg) => {
      if (msg.user_id) {
        tokensByUser[msg.user_id] = (tokensByUser[msg.user_id] || 0) + (msg.token_count || 0)
      }
    })

    // Calculate total group tokens
    const totalTokens = Object.values(tokensByUser).reduce((sum, count) => sum + count, 0)

    // Combine member info with profile data and token counts
    const membersWithProfiles = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id)
      return {
        ...member,
        first_name: profile?.first_name || 'Unknown',
        last_name: profile?.last_name || '',
        email: profile?.email,
        total_tokens: tokensByUser[member.user_id] || 0,
      }
    })

    return NextResponse.json({ members: membersWithProfiles, totalTokens })
  } catch (error: any) {
    console.error('Group members GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
