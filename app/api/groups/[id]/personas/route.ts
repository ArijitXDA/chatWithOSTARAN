// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all personas from group members
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
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)

    if (!members || members.length === 0) {
      return NextResponse.json({ personas: [] })
    }

    const memberIds = members.map(m => m.user_id)

    // Get all personas from these members
    const { data: personas, error: personasError } = await supabase
      .from('custom_personas')
      .select('id, user_id, name, icon, description')
      .in('user_id', memberIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (personasError) {
      console.error('Error fetching personas:', personasError)
      return NextResponse.json({ error: 'Failed to load personas' }, { status: 500 })
    }

    // Get user names for personas
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', memberIds)

    // Combine persona data with user names
    const personasWithNames = personas.map(persona => {
      const profile = profiles?.find(p => p.id === persona.user_id)
      return {
        ...persona,
        user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
      }
    })

    return NextResponse.json({ personas: personasWithNames })
  } catch (error: any) {
    console.error('Group personas GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
