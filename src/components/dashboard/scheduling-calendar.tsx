'use client'

import React, { useState, useEffect } from 'react'

interface ScheduledPost {
  id: string
  clipId: number
  userId: string
  platform: string
  accountId: string
  scheduledTime: Date | string
  status: 'pending' | 'posted' | 'failed' | 'cancelled'
  title: string
  description?: string
  hashtags?: string[]
  thumbnailUrl?: string
  videoUrl: string
  postId?: string
  error?: string
  createdAt: Date | string
  updatedAt: Date | string
}

export function SchedulingCalendar() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchScheduledPosts()
  }, [currentMonth])

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social/posts')
      if (response.ok) {
        const data = await response.json()
        setScheduledPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getPostsForDay = (day: number) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduledTime)
      return postDate.getDate() === day &&
             postDate.getMonth() === currentMonth.getMonth() &&
             postDate.getFullYear() === currentMonth.getFullYear()
    })
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      youtube: '📺',
      tiktok: '🎵',
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
      facebook: '👍'
    }
    return icons[platform.toLowerCase()] || '📱'
  }

  const getStatusColor = (status: ScheduledPost['status']) => {
    const colors: Record<string, string> = {
      pending: 'bg-primary/10 text-primary',
      posted: 'bg-accent-success/10 text-accent-success',
      failed: 'bg-accent-danger/10 text-accent-danger',
      cancelled: 'bg-muted text-muted-foreground'
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days: React.JSX.Element[] = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 h-32 border border-gray-200 bg-gray-50" />
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const postsForDay = getPostsForDay(day)
      
      days.push(
        <div key={day} className="p-2 h-32 border border-gray-200 bg-white">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-900">{day}</span>
            {postsForDay.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                {postsForDay.length}
              </span>
            )}
          </div>
          
          <div className="space-y-1 overflow-y-auto max-h-20">
            {postsForDay.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="cursor-pointer bg-gray-50 border border-gray-200 rounded p-1 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span className="text-xs">{getPlatformIcon(post.platform)}</span>
                  <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                    {post.status === 'pending' && '⏰'}
                    {post.status === 'posted' && '✅'}
                    {post.status === 'failed' && '❌'}
                    {post.status === 'cancelled' && '⏸️'}
                  </span>
                </div>
                <div className="text-xs text-gray-700 truncate mt-1">
                  {new Date(post.scheduledTime).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            ))}
            {postsForDay.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{postsForDay.length - 3} more
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Publishing Calendar</h2>
            <p className="text-gray-600 mt-1">Schedule and manage your social media posts</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-xl font-semibold text-gray-900 min-w-48 text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-primary">
            {scheduledPosts.filter(p => p.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Scheduled Posts</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-accent-success">
            {scheduledPosts.filter(p => p.status === 'posted').length}
          </div>
          <div className="text-sm text-gray-600">Published This Month</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-accent-warning">
            {new Set(scheduledPosts.map(p => p.platform)).size}
          </div>
          <div className="text-sm text-gray-600">Active Platforms</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-accent-danger">
            {scheduledPosts.filter(p => p.status === 'failed').length}
          </div>
          <div className="text-sm text-gray-600">Failed Posts</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-7 gap-px mb-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-100">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px">
          {renderCalendarGrid()}
        </div>
      </div>
    </div>
  )
}
