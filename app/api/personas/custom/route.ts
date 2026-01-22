import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch user's custom personas
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: personas, error } = await supabase
      .from('custom_personas')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching custom personas:', error)
      return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
    }

    return NextResponse.json({ personas })
  } catch (error: any) {
    console.error('Custom personas GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new custom persona
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const personaData = await request.json()

    // Add user_id to the persona data
    const insertData = {
      ...personaData,
      user_id: user.id,
    }

    const { data: persona, error } = await supabase
      .from('custom_personas')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating custom persona:', error)
      return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 })
    }

    return NextResponse.json({ persona })
  } catch (error: any) {
    console.error('Custom personas POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
