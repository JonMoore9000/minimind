import { createClient } from '@/lib/supabase/server'
import { Plan, Profile } from '@/lib/types/database'

export interface PlanLimits {
  daily_chats: number
  max_child_profiles: number
  save_history_days: number
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    daily_chats: 5,
    max_child_profiles: 1,
    save_history_days: 0,
  },
  plus: {
    daily_chats: 200,
    max_child_profiles: 5,
    save_history_days: 365,
  },
}

export const FEATURE_FLAGS = {
  bedtime_mode: { free: false, plus: true },
  learning_mode: { free: false, plus: true },
  save_and_replay: { free: false, plus: true },
  parent_dashboard: { free: false, plus: true },
  story_personalization: { free: false, plus: true },
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = await createClient()
  
  // First check subscriptions table for active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (subscription && subscription.plan === 'plus') {
    return 'plus'
  }

  // Fallback to profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('user_id', userId)
    .single()

  return profile?.plan || 'free'
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  return profile
}

export async function getDailyUsage(userId: string, date?: string): Promise<number> {
  const supabase = await createClient()
  const targetDate = date || new Date().toISOString().split('T')[0]
  
  const { data: usage } = await supabase
    .from('usage_counters')
    .select('chat_count')
    .eq('user_id', userId)
    .eq('date', targetDate)
    .single()

  return usage?.chat_count || 0
}

export async function incrementDailyUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: existing } = await supabase
    .from('usage_counters')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (existing) {
    await supabase
      .from('usage_counters')
      .update({ chat_count: existing.chat_count + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('usage_counters')
      .insert({
        user_id: userId,
        date: today,
        chat_count: 1,
      })
  }
}

export async function canUserChat(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId)
  const dailyUsage = await getDailyUsage(userId)
  const limits = PLAN_LIMITS[plan]

  if (dailyUsage >= limits.daily_chats) {
    return {
      allowed: false,
      reason: plan === 'free' 
        ? 'Daily limit reached. Upgrade to MiniMind Plus for unlimited chats!'
        : 'Daily fair-use limit reached. Please try again tomorrow.'
    }
  }

  return { allowed: true }
}

export function hasFeature(plan: Plan, feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature][plan]
}

export async function getChildProfilesCount(userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { count } = await supabase
    .from('child_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count || 0
}

export async function canCreateChildProfile(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId)
  const currentCount = await getChildProfilesCount(userId)
  const limits = PLAN_LIMITS[plan]

  if (currentCount >= limits.max_child_profiles) {
    return {
      allowed: false,
      reason: plan === 'free'
        ? 'Upgrade to MiniMind Plus to create up to 5 child profiles!'
        : 'Maximum child profiles reached for your plan.'
    }
  }

  return { allowed: true }
}
