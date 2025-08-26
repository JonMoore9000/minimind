import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
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

    if (!profile || !profile.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0]
      
      // Update profile to Plus
      await supabase
        .from('profiles')
        .update({ plan: 'plus' })
        .eq('user_id', user.id)

      // Update or create subscription record
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: profile.stripe_customer_id,
          stripe_subscription_id: subscription.id,
          plan: 'plus',
          status: 'active',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })

      return NextResponse.json({ 
        success: true, 
        message: 'Subscription synced successfully',
        plan: 'plus'
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'No active subscription found in Stripe'
      })
    }
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
