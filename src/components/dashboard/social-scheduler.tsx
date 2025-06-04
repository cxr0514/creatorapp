'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlatformIcon, PlatformBadge, getAllPlatformConfigs } from '@/lib/platform-icons'
import { Calendar, Clock, BarChart3, Zap, CheckCircle, AlertCircle } from 'lucide-react'

interface ScheduledPost {
  id: string
  title: string
  description: string
  platforms: string[]
  scheduledTime: Date
  status: 'scheduled' | 'publishing' | 'published' | 'failed'
  thumbnailUrl?: string
  videoUrl?: string
  analytics?: {
    views: number
    likes: number
    shares: number
    comments: number
  }
}

interface OptimalTime {
  platform: string
  time: string
  engagement: number
  reason: string
}

export function SocialScheduler() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    loadScheduledPosts()
    loadOptimalTimes()
  }, [])

  const loadScheduledPosts = async () => {
    try {
      const response = await fetch('/api/social/scheduled-posts')
      if (response.ok) {
        const data = await response.json()
        setScheduledPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error loading scheduled posts:', error)
    }
  }

  const loadOptimalTimes = async () => {
    try {
      const response = await fetch('/api/social/optimal-times')
      if (response.ok) {
        const data = await response.json()
        setOptimalTimes(data.optimalTimes || [])
      }
    } catch (error) {
      console.error('Error loading optimal times:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'publishing':
        return <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'publishing':
        return 'bg-yellow-100 text-yellow-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Scheduler</h2>
          <p className="text-gray-600 mt-1">Optimize your posting schedule for maximum engagement</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedView === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Button>
          <Button
            variant={selectedView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('list')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {/* Optimal Times */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Posting Times</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optimalTimes.map((optimal, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <PlatformIcon platformId={optimal.platform} size="md" />
                <div>
                  <div className="font-medium text-gray-900">{optimal.time}</div>
                  <div className="text-sm text-gray-600">{optimal.engagement}% avg engagement</div>
                </div>
              </div>
              <p className="text-xs text-gray-500">{optimal.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Posts */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Scheduled Posts</h3>
            <span className="text-sm text-gray-600">{scheduledPosts.length} posts scheduled</span>
          </div>
        </div>
        
        <div className="p-6">
          {scheduledPosts.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled posts</h3>
              <p className="text-gray-600 mb-4">Schedule your first post to see it here</p>
              <Button className="bg-purple-600 hover:bg-purple-700">Schedule Post</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    {post.thumbnailUrl && (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={post.thumbnailUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusIcon(post.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {post.scheduledTime.toLocaleDateString()} at {post.scheduledTime.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {post.platforms.map(platformId => (
                            <PlatformBadge key={platformId} platformId={platformId} variant="outline" />
                          ))}
                        </div>
                      </div>
                      
                      {/* Analytics */}
                      {post.status === 'published' && post.analytics && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold text-gray-900">{post.analytics.views.toLocaleString()}</div>
                              <div className="text-xs text-gray-600">Views</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">{post.analytics.likes.toLocaleString()}</div>
                              <div className="text-xs text-gray-600">Likes</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">{post.analytics.shares.toLocaleString()}</div>
                              <div className="text-xs text-gray-600">Shares</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">{post.analytics.comments.toLocaleString()}</div>
                              <div className="text-xs text-gray-600">Comments</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
