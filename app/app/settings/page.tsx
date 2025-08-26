'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { ArrowLeft, Crown, Plus, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'

interface ChildProfile {
  id: string
  name: string
  age: number | null
  favorites: Record<string, unknown>
}

interface UsageData {
  plan: 'free' | 'plus'
  dailyUsage: number
  dailyLimit: number
  remaining: number
  canChat: boolean
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([])
  const [showAddChild, setShowAddChild] = useState(false)
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null)
  const [newChildName, setNewChildName] = useState('')
  const [newChildAge, setNewChildAge] = useState('')
  const [newChildFavorites, setNewChildFavorites] = useState({
    animal: '',
    color: '',
    toy: '',
    food: ''
  })
  
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

  const fetchChildProfiles = async () => {
    try {
      const response = await fetch('/api/child-profiles')
      if (response.ok) {
        const data = await response.json()
        setChildProfiles(data.profiles)
      }
    } catch (error) {
      console.error('Error fetching child profiles:', error)
    }
  }

  const handleAddChild = async () => {
    if (!newChildName.trim()) return

    try {
      const response = await fetch('/api/child-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChildName,
          age: newChildAge ? parseInt(newChildAge) : null,
          favorites: newChildFavorites
        }),
      })

      if (response.ok) {
        await fetchChildProfiles()
        setShowAddChild(false)
        setNewChildName('')
        setNewChildAge('')
        setNewChildFavorites({ animal: '', color: '', toy: '', food: '' })
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      console.error('Error adding child:', error)
    }
  }

  const handleUpdateChild = async () => {
    if (!editingChild || !newChildName.trim()) return

    try {
      const response = await fetch(`/api/child-profiles/${editingChild.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChildName,
          age: newChildAge ? parseInt(newChildAge) : null,
          favorites: newChildFavorites
        }),
      })

      if (response.ok) {
        await fetchChildProfiles()
        setEditingChild(null)
        setNewChildName('')
        setNewChildAge('')
        setNewChildFavorites({ animal: '', color: '', toy: '', food: '' })
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      console.error('Error updating child:', error)
    }
  }

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child profile?')) return

    try {
      const response = await fetch(`/api/child-profiles/${childId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchChildProfiles()
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      console.error('Error deleting child:', error)
    }
  }

  const startEditChild = (child: ChildProfile) => {
    setEditingChild(child)
    setNewChildName(child.name)
    setNewChildAge(child.age?.toString() || '')

    // Safely access favorites with type casting
    const favorites = child.favorites as { animal?: string; color?: string; toy?: string; food?: string } || {}
    setNewChildFavorites({
      animal: favorites.animal || '',
      color: favorites.color || '',
      toy: favorites.toy || '',
      food: favorites.food || ''
    })
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        alert('Unable to access subscription management')
      }
    } catch (error) {
      console.error('Error accessing portal:', error)
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/app" className="p-2 hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          
          {usage?.plan === 'plus' && (
            <div className="flex items-center space-x-1 bg-indigo-600 px-2 py-1 rounded-full text-xs">
              <Crown className="h-3 w-3" />
              <span>Plus</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Account Info */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-2">
            <p><span className="text-gray-400">Email:</span> {user?.email}</p>
            <p><span className="text-gray-400">Plan:</span> {usage?.plan === 'plus' ? 'MiniMind Plus' : 'MiniMind Basic'}</p>
            {usage && (
              <p><span className="text-gray-400">Daily Usage:</span> {usage.dailyUsage}/{usage.dailyLimit === 200 ? '∞' : usage.dailyLimit} chats</p>
            )}
          </div>
          
          <div className="mt-6 space-y-3">
            {usage?.plan === 'free' ? (
              <Link
                href="/pricing"
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade to Plus</span>
              </Link>
            ) : (
              <button
                onClick={handleManageSubscription}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition"
              >
                Manage Subscription
              </button>
            )}
          </div>
        </div>

        {/* Child Profiles */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Child Profiles</h2>
            <button
              onClick={() => setShowAddChild(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Child</span>
            </button>
          </div>

          <div className="space-y-4">
            {childProfiles.map((child) => (
              <div key={child.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{child.name}</h3>
                  {child.age && <p className="text-sm text-gray-400">{child.age} years old</p>}
                  {Object.keys(child.favorites).length > 0 && (
                    <p className="text-sm text-gray-400 mt-1">
                      Favorites: {Object.entries(child.favorites)
                        .filter(([, value]) => value)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditChild(child)}
                    className="p-2 hover:bg-gray-600 rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteChild(child.id)}
                    className="p-2 hover:bg-red-600 rounded-lg text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {childProfiles.length === 0 && (
              <p className="text-gray-400 text-center py-8">
                No child profiles yet. Add one to get personalized stories!
              </p>
            )}
          </div>
        </div>

        {/* Add/Edit Child Modal */}
        {(showAddChild || editingChild) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">
                {editingChild ? 'Edit Child Profile' : 'Add Child Profile'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    placeholder="Child's name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    type="number"
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    placeholder="Age (optional)"
                    min="1"
                    max="18"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Favorites (for personalized stories)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newChildFavorites.animal}
                      onChange={(e) => setNewChildFavorites({...newChildFavorites, animal: e.target.value})}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      placeholder="Favorite animal"
                    />
                    <input
                      type="text"
                      value={newChildFavorites.color}
                      onChange={(e) => setNewChildFavorites({...newChildFavorites, color: e.target.value})}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      placeholder="Favorite color"
                    />
                    <input
                      type="text"
                      value={newChildFavorites.toy}
                      onChange={(e) => setNewChildFavorites({...newChildFavorites, toy: e.target.value})}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      placeholder="Favorite toy"
                    />
                    <input
                      type="text"
                      value={newChildFavorites.food}
                      onChange={(e) => setNewChildFavorites({...newChildFavorites, food: e.target.value})}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      placeholder="Favorite food"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={editingChild ? handleUpdateChild : handleAddChild}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  {editingChild ? 'Update' : 'Add'} Child
                </button>
                <button
                  onClick={() => {
                    setShowAddChild(false)
                    setEditingChild(null)
                    setNewChildName('')
                    setNewChildAge('')
                    setNewChildFavorites({ animal: '', color: '', toy: '', food: '' })
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
