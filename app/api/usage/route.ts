import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getDailyUsage, PLAN_LIMITS } from '@/lib/subscription'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await getUserPlan(user.id)
    const dailyUsage = await getDailyUsage(user.id)
    const limits = PLAN_LIMITS[plan]

    return NextResponse.json({
      plan,
      dailyUsage,
      dailyLimit: limits.daily_chats,
      remaining: Math.max(0, limits.daily_chats - dailyUsage),
      canChat: dailyUsage < limits.daily_chats,
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
