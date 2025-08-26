'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const features = [
  {
    name: 'Daily Chats',
    free: '5',
    plus: 'Unlimited (fair-use)',
  },
  {
    name: 'Custom Stories (Name, Favorites)',
    free: false,
    plus: true,
  },
  {
    name: 'Bedtime Mode',
    free: false,
    plus: true,
  },
  {
    name: 'Learning Mode (by age)',
    free: false,
    plus: true,
  },
  {
    name: 'Save & Replay',
    free: false,
    plus: true,
  },
  {
    name: 'Parent Dashboard',
    free: false,
    plus: true,
  },
  {
    name: 'Child Profiles',
    free: '1',
    plus: 'Up to 5',
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [supabase.auth])

  const handleUpgrade = async () => {
    // Check if user is authenticated
    if (isAuthenticated === false) {
      // Redirect to signup with return URL
      router.push(`/auth/signup?redirectTo=${encodeURIComponent('/pricing')}`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        // User is not authenticated, redirect to login
        router.push(`/auth/login?redirectTo=${encodeURIComponent('/pricing')}`)
        return
      }

      const { sessionId } = await response.json()

      if (sessionId) {
        // Redirect to Stripe Checkout
        const stripe = (await import('@stripe/stripe-js')).loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        )
        const stripeInstance = await stripe
        await stripeInstance?.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center mb-8">
            <Image className="h-8 w-auto mr-2" src="/mmlogo.png" alt="MiniMind" width={32} height={32} />
            <span className="text-2xl font-bold text-white">MiniMind</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Big questions, little answers. Now with even more features for growing minds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">MiniMind Basic</h3>
              <div className="text-4xl font-semibold text-white mb-2">Free</div>
              <p className="text-gray-400">Perfect for trying out MiniMind</p>
            </div>
            
            <Link
              href="/auth/signup"
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 text-center block mb-8"
            >
              Start Free
            </Link>

            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature.name} className="flex items-center">
                  {feature.free === false ? (
                    <X className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                  ) : (
                    <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  )}
                  <span className="text-gray-300">
                    {feature.name}: {feature.free === false ? '—' : feature.free === true ? '✓' : feature.free}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plus Plan */}
          <div className="bg-indigo-900 rounded-lg p-8 border-2 border-indigo-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">MiniMind Plus</h3>
              <div className="text-4xl font-semibold text-white mb-2">
                $7<span className="text-lg text-gray-300">/month</span>
              </div>
              <p className="text-gray-300">Everything your family needs</p>
            </div>
            
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 mb-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating checkout...</span>
                </div>
              ) : isAuthenticated === false ? (
                'Sign Up & Upgrade to Plus'
              ) : (
                'Upgrade to Plus'
              )}
            </button>

            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature.name} className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-200">
                    {feature.name}: {feature.plus === true ? '✓' : feature.plus}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Questions? We&apos;re here to help.
          </p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            ← Back to MiniMind
          </Link>
        </div>
      </div>
    </div>
  )
}
