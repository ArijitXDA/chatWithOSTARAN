import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch a specific custom persona
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: persona, error } = await supabase
      .from('custom_personas')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching custom persona:', error)
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    return NextResponse.json({ persona })
  } catch (error: any) {
    console.error('Custom persona GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update a custom persona
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData = await request.json()

    const { data: persona, error } = await supabase
      .from('custom_personas')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating custom persona:', error)
      return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 })
    }

    return NextResponse.json({ persona })
  } catch (error: any) {
    console.error('Custom persona PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a custom persona
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('custom_personas')
      .update({ is_active: false })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting custom persona:', error)
      return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Custom persona DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
