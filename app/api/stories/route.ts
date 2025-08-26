import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, hasFeature } from '@/lib/subscription'

export async function GET() {
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

    // Get all stories for the user, ordered by most recent first
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        child_profiles (
          id,
          name,
          age
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching stories:', error)
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
    }

    return NextResponse.json({ stories })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
