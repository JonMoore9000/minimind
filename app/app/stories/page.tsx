'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Trash2, Calendar, User as UserIcon, Crown } from 'lucide-react'
import Link from 'next/link'

interface Story {
  id: string
  title: string | null
  content: string | null
  mode: string | null
  created_at: string
  child_profiles: {
    id: string
    name: string
    age: number | null
  } | null
  metadata: Record<string, unknown>
}

interface UsageData {
  plan: 'free' | 'plus'
  dailyUsage: number
  dailyLimit: number
  remaining: number
  canChat: boolean
}

export default function StoriesPage() {
  const [loading, setLoading] = useState(true)
  const [stories, setStories] = useState<Story[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      await fetchUsage()
      await fetchStories()
      setLoading(false)
    }

    getUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories')
      if (response.ok) {
        const data = await response.json()
        setStories(data.stories)
      } else if (response.status === 403) {
        // User doesn't have access to save & replay
        router.push('/app')
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    }
  }

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return
    
    setDeleteLoading(storyId)
    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setStories(stories.filter(story => story.id !== storyId))
        if (selectedStory?.id === storyId) {
          setSelectedStory(null)
        }
      } else {
        alert('Failed to delete story')
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      alert('Failed to delete story')
    } finally {
      setDeleteLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getModeIcon = (mode: string | null) => {
    switch (mode) {
      case 'bedtime':
        return '🌙'
      case 'learning':
        return '⭐'
      case 'custom':
        return '📖'
      default:
        return '💭'
    }
  }

  const getModeLabel = (mode: string | null) => {
    switch (mode) {
      case 'bedtime':
        return 'Bedtime Story'
      case 'learning':
        return 'Learning Mode'
      case 'custom':
        return 'Custom Story'
      default:
        return 'Q&A'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Check if user has Plus plan
  if (usage?.plan !== 'plus') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/app" className="p-2 hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold">My Stories</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6 text-center">
          <div className="bg-gray-800 rounded-lg p-8">
            <Crown className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Save & Replay Stories</h2>
            <p className="text-gray-300 mb-6">
              Upgrade to MiniMind Plus to save your favorite stories and replay them anytime!
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium transition"
            >
              <Crown className="h-4 w-4" />
              <span>Upgrade to Plus</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/app" className="p-2 hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">My Stories</h1>
          </div>
          
          <div className="flex items-center space-x-1 bg-indigo-600 px-2 py-1 rounded-full text-xs">
            <Crown className="h-3 w-3" />
            <span>Plus</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {stories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No stories yet</h2>
            <p className="text-gray-400 mb-6">
              Stories you create will be automatically saved here for you to replay anytime.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition"
            >
              <BookOpen className="h-4 w-4" />
              <span>Create Your First Story</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stories List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">
                Saved Stories ({stories.length})
              </h2>
              
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition ${
                    selectedStory?.id === story.id ? 'ring-2 ring-indigo-500' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getModeIcon(story.mode)}</span>
                        <span className="text-sm text-indigo-400">{getModeLabel(story.mode)}</span>
                      </div>
                      
                      <h3 className="font-medium mb-1">
                        {story.title || 'Untitled Story'}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(story.created_at)}</span>
                        </div>
                        
                        {story.child_profiles && (
                          <div className="flex items-center space-x-1">
                            <UserIcon className="h-3 w-3" />
                            <span>{story.child_profiles.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteStory(story.id)
                      }}
                      disabled={deleteLoading === story.id}
                      className="p-1 text-gray-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Story Content */}
            <div className="lg:sticky lg:top-6">
              {selectedStory ? (
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl">{getModeIcon(selectedStory.mode)}</span>
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedStory.title || 'Untitled Story'}
                      </h2>
                      <p className="text-sm text-gray-400">{getModeLabel(selectedStory.mode)}</p>
                    </div>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-100">
                      {selectedStory.content}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Created {formatDate(selectedStory.created_at)}</span>
                      {selectedStory.child_profiles && (
                        <span>For {selectedStory.child_profiles.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Select a story to read it</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
