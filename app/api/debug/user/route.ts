import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get subscription data
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get current plan
    const currentPlan = await getUserPlan(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      subscription,
      currentPlan,
      debug: {
        hasProfile: !!profile,
        hasSubscription: !!subscription,
        profilePlan: profile?.plan,
        subscriptionPlan: subscription?.plan,
        subscriptionStatus: subscription?.status,
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
