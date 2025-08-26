import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, hasFeature } from '@/lib/subscription'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has save_and_replay feature
    const plan = await getUserPlan(user.id)
    if (!hasFeature(plan, 'save_and_replay')) {
      return NextResponse.json({ 
        error: 'Save & Replay is only available with MiniMind Plus',
        upgradeRequired: true 
      }, { status: 403 })
    }

    const params = await context.params
    const storyId = params.id

    // Get specific story for the user
    const { data: story, error } = await supabase
      .from('stories')
      .select(`
        *,
        child_profiles (
          id,
          name,
          age
        )
      `)
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching story:', error)
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    return NextResponse.json({ story })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has save_and_replay feature
    const plan = await getUserPlan(user.id)
    if (!hasFeature(plan, 'save_and_replay')) {
      return NextResponse.json({ 
        error: 'Save & Replay is only available with MiniMind Plus',
        upgradeRequired: true 
      }, { status: 403 })
    }

    const params = await context.params
    const storyId = params.id

    // Delete story (RLS ensures user can only delete their own stories)
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting story:', error)
      return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
