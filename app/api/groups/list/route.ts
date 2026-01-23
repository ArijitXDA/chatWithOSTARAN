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

    // Get all groups where user is a member
    const { data: memberRecords, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    if (memberError) {
      console.error('Error fetching member records:', memberError)
      return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 })
    }

    const groupIds = memberRecords.map(m => m.group_id)

    if (groupIds.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    // Fetch group details
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
      return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 })
    }

    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)

        return { ...group, member_count: count || 0 }
      })
    )

    return NextResponse.json({ groups: groupsWithCounts })
  } catch (error: any) {
    console.error('Groups list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
