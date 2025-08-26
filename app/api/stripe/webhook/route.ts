import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createServiceClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        if (!userId) {
          console.error('No user ID in session metadata')
          break
        }

        // Update user profile and create subscription record
        await supabase
          .from('profiles')
          .update({ 
            plan: 'plus',
            stripe_customer_id: session.customer as string
          })
          .eq('user_id', userId)

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: 'plus',
            status: 'active',
          })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('No profile found for customer:', customerId)
          break
        }

        const plan = subscription.status === 'active' ? 'plus' : 'free'

        // Update profile and subscription
        await supabase
          .from('profiles')
          .update({ plan })
          .eq('user_id', profile.user_id)

        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('No profile found for customer:', customerId)
          break
        }

        // Downgrade to free plan
        await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('user_id', profile.user_id)

        await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
