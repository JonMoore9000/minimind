import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
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
      const subscriptionData: {
        user_id: string;
        stripe_customer_id: string;
        stripe_subscription_id: string;
        plan: string;
        status: string;
        current_period_end?: string;
      } = {
        user_id: user.id,
        stripe_customer_id: profile.stripe_customer_id,
        stripe_subscription_id: subscription.id,
        plan: 'plus',
        status: 'active',
      }

      // Add current_period_end if it exists (cast to any to handle Stripe type variations)
      const stripeSubscription = subscription as any
      if (stripeSubscription.current_period_end) {
        subscriptionData.current_period_end = new Date(stripeSubscription.current_period_end * 1000).toISOString()
      }

      await supabase
        .from('subscriptions')
        .upsert(subscriptionData)

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
