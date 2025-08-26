import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body (couponCode is optional, mainly from app modal)
    const { couponCode } = await req.json().catch(() => ({}))

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      
      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Prepare checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/app?success=true`,
      cancel_url: `${process.env.APP_URL}/pricing?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
      allow_promotion_codes: true, // Always allow promotion codes
    }

    // Add coupon if provided
    if (couponCode) {
      try {
        // Validate the coupon exists in Stripe
        const coupon = await stripe.coupons.retrieve(couponCode)
        if (coupon.valid) {
          sessionOptions.discounts = [{
            coupon: couponCode
          }]
        }
      } catch (couponError) {
        console.error('Invalid coupon code:', couponCode, couponError)
        return NextResponse.json(
          { error: 'Invalid coupon code' },
          { status: 400 }
        )
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
