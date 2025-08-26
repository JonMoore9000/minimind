import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Stripe
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    
    // OpenAI
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    
    // App
    APP_URL: !!process.env.APP_URL,
  }

  const missingVars = Object.entries(envVars)
    .filter(([_, isSet]) => !isSet)
    .map(([name]) => name)

  return NextResponse.json({
    status: missingVars.length === 0 ? 'healthy' : 'missing_env_vars',
    environment_variables: envVars,
    missing_variables: missingVars,
    stripe_config: {
      price_id: process.env.NODE_ENV === 'development' ? 'visible_in_dev' : 'hidden_in_prod',
      product_id: process.env.NODE_ENV === 'development' ? 'visible_in_dev' : 'hidden_in_prod'
    }
  })
}
