'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Settings, Crown, Sparkles, Moon, BookOpen, Star } from 'lucide-react'
import Link from 'next/link'

interface UsageData {
  plan: 'free' | 'plus'
  dailyUsage: number
  dailyLimit: number
  remaining: number
  canChat: boolean
}

interface ChildProfile {
  id: string
  name: string
  age: number | null
  favorites: Record<string, any>
}

export default function AppPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [mode, setMode] = useState<'explain' | 'story' | 'bedtime' | 'learning'>('explain')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<any>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      await fetchUsage()
      await fetchChildProfiles()
      setLoading(false)
    }

    getUser()
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

  const fetchChildProfiles = async () => {
    try {
      const response = await fetch('/api/child-profiles')
      if (response.ok) {
        const data = await response.json()
        setChildProfiles(data.profiles)
        if (data.profiles.length > 0 && !selectedChild) {
          setSelectedChild(data.profiles[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching child profiles:', error)
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || chatLoading) return

    setChatLoading(true)
    setResult(null)

    try {
      let endpoint = '/api/explain'
      let payload: any = { topic: input }

      if (mode === 'story') {
        endpoint = '/api/story'
        payload = { 
          prompt: input, 
          childId: selectedChild,
          personalized: usage?.plan === 'plus' && selectedChild 
        }
      } else if (mode === 'bedtime') {
        endpoint = '/api/bedtime'
        payload = { 
          prompt: input, 
          childId: selectedChild,
          includePoem: true 
        }
      } else if (mode === 'learning') {
        endpoint = '/api/learning'
        const selectedChildData = childProfiles.find(c => c.id === selectedChild)
        payload = { 
          question: input, 
          age: selectedChildData?.age || 6 
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.status === 403 && data.upgradeRequired) {
        setShowUpgradeModal(true)
      } else if (response.status === 429 && data.limitReached) {
        setShowUpgradeModal(true)
      } else if (response.ok) {
        setResult(data)
        await fetchUsage() // Refresh usage after successful request
      } else {
        console.error('API Error:', data.error)
      }
    } catch (error) {
      console.error('Request error:', error)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleUpgradeFromModal = async () => {
    setUpgradeLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: couponCode.trim() || undefined
        }),
      })

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
      setUpgradeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl px-6 mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img className="h-8 w-auto" src="/mmlogo.png" alt="MiniMind" />
            <h1 className="text-xl font-bold">MiniMind</h1>
            {usage?.plan === 'plus' && (
              <div className="flex items-center space-x-1 bg-indigo-600 px-2 py-1 rounded-full text-xs">
                <Crown className="h-3 w-3" />
                <span>Plus</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              {usage && (
                <span>
                  {usage.dailyUsage}/{usage.dailyLimit === 200 ? '∞' : usage.dailyLimit} chats today
                </span>
              )}
            </div>
            <Link href="/app/settings" className="p-2 hover:bg-gray-700 rounded-lg">
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Mode Selection */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMode('explain')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                mode === 'explain' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Ask & Learn</span>
            </button>
            
            <button
              onClick={() => setMode('story')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                mode === 'story' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Story Time</span>
            </button>
            
            <button
              onClick={() => setMode('bedtime')}
              disabled={usage?.plan !== 'plus'}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                mode === 'bedtime' ? 'bg-indigo-600' : 
                usage?.plan !== 'plus' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' :
                'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Bedtime</span>
              {usage?.plan !== 'plus' && <Crown className="h-3 w-3" />}
            </button>
            
            <button
              onClick={() => setMode('learning')}
              disabled={usage?.plan !== 'plus'}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                mode === 'learning' ? 'bg-indigo-600' : 
                usage?.plan !== 'plus' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' :
                'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Star className="h-4 w-4" />
              <span>Learning</span>
              {usage?.plan !== 'plus' && <Crown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Child Selection */}
        {childProfiles.length > 0 && (mode === 'story' || mode === 'bedtime' || mode === 'learning') && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Child:</label>
            <select
              value={selectedChild || ''}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {childProfiles.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} {child.age && `(${child.age} years old)`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Input */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={
                mode === 'explain' ? 'Ask anything... (e.g., What is a black hole?)' :
                mode === 'story' ? 'Tell me a story about...' :
                mode === 'bedtime' ? 'Create a bedtime story about...' :
                'I want to learn about...'
              }
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSubmit}
              disabled={chatLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition flex items-center justify-center"
            >
              {chatLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Thinking...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4"
            >
              {mode === 'explain' && (
                <>
                  <div className="bg-indigo-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🧒 For Kids:</h3>
                    <p>{result.kid}</p>
                  </div>
                  <div className="bg-green-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">👨‍👩 For Parents:</h3>
                    <p>{result.parent}</p>
                  </div>
                  <div className="bg-yellow-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">💡 Fun Thought:</h3>
                    <p>{result.fun}</p>
                  </div>
                </>
              )}
              
              {(mode === 'story' || mode === 'bedtime') && (
                <div className="bg-purple-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">{result.title}</h3>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-100 leading-relaxed">
                      {result.content.split('\n').map((paragraph: string, index: number) => (
                        paragraph.trim() ? (
                          <p key={index} className="mb-4 last:mb-0">
                            {paragraph.trim()}
                          </p>
                        ) : null
                      ))}
                    </div>
                  </div>
                  {result.poem && (
                    <div className="mt-4 p-4 bg-purple-900 rounded-lg">
                      <h4 className="font-semibold mb-2">🎵 Lullaby:</h4>
                      <p className="italic whitespace-pre-wrap">{result.poem}</p>
                    </div>
                  )}
                  {result.sleepyMessage && (
                    <div className="mt-4 text-center text-purple-200">
                      {result.sleepyMessage}
                    </div>
                  )}
                </div>
              )}
              
              {mode === 'learning' && (
                <>
                  <div className="bg-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">📚 Answer:</h3>
                    <p>{result.answer}</p>
                  </div>
                  {result.funFact && (
                    <div className="bg-green-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">🤔 Fun Fact:</h3>
                      <p>{result.funFact}</p>
                    </div>
                  )}
                  {result.activity && (
                    <div className="bg-orange-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">🔬 Try This:</h3>
                      <p>{result.activity}</p>
                    </div>
                  )}
                  {result.nextQuestions && (
                    <div className="bg-indigo-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">❓ What's Next:</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {result.nextQuestions.map((q: string, i: number) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Upgrade to MiniMind Plus</h3>
              <p className="text-gray-300 mb-6">
                {usage?.plan === 'free'
                  ? "You've reached your daily limit. Upgrade to Plus for unlimited chats, personalized stories, bedtime mode, and more!"
                  : "This feature is only available with MiniMind Plus."
                }
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={handleUpgradeFromModal}
                  disabled={upgradeLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center"
                >
                  {upgradeLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Creating checkout...</span>
                    </div>
                  ) : (
                    'Upgrade Now'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false)
                    setCouponCode('')
                    setUpgradeLoading(false)
                  }}
                  disabled={upgradeLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <footer className="text-center py-8 text-gray-400">
        <p>Built with <Heart size={16} className="inline mx-1" /> by <a className="underline" href="https://x.com/JontheNerd_" target='_blank'>Jon</a></p>
      </footer>
    </div>
  )
}
