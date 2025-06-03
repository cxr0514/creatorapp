'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { VideoUpload } from './video-upload'
import { VideoList } from './video-list'
import { ClipList } from './clip-list'
import { EnhancedCreateClipModal } from './enhanced-create-clip-modal'
import { SocialConnections } from './social-connections'
import { CalendarWidget } from '../calendar/calendar-widget'
import { SchedulingModal } from '../calendar/scheduling-modal'
import { WorkflowBuilder } from './workflow-builder'
import { AnalyticsDashboard } from './analytics-dashboard-refactored'
import { AIMetadataEnhancer } from './ai-metadata-enhancer'
import { BatchAIProcessor } from './batch-ai-processor'
import { 
  HomeIcon, 
  VideoCameraIcon, 
  ScissorsIcon, 
  CalendarIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  UserIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  PlayIcon,
  CloudArrowUpIcon,
  ClockIcon,
  CircleStackIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  PlusIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export function ModernDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showVideoUpload, setShowVideoUpload] = useState(false)
  const [showCreateClipModal, setShowCreateClipModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<{ id: number; title: string; url: string; duration: number; thumbnailUrl?: string }>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [clipRefreshKey, setClipRefreshKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileTab, setProfileTab] = useState('settings')
  const [showSchedulingModal, setShowSchedulingModal] = useState(false)
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date>()
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [platforms] = useState([
    { id: 'youtube', name: 'YouTube', connected: true, optimalTimes: ['14:00', '16:00', '20:00'], audience: 125000 },
    { id: 'tiktok', name: 'TikTok', connected: true, optimalTimes: ['18:00', '20:00', '22:00'], audience: 85000 },
    { id: 'instagram', name: 'Instagram', connected: false, optimalTimes: ['11:00', '14:00', '17:00'], audience: 0 },
    { id: 'twitter', name: 'Twitter', connected: false, optimalTimes: ['09:00', '12:00', '17:00'], audience: 0 }
  ])

  // Fetch scheduled posts on component mount
  useEffect(() => {
    fetchScheduledPosts()
  }, [])

  const handleUploadComplete = () => {
    setShowVideoUpload(false)
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateClip = (video?: { id: number; title: string; url: string; duration: number; thumbnailUrl?: string }) => {
    if (video) {
      setSelectedVideo(video)
    } else {
      setSelectedVideo(undefined)
    }
    setShowCreateClipModal(true)
  }

  const handleClipCreated = () => {
    setShowCreateClipModal(false)
    setActiveTab('clips')
    setClipRefreshKey(prev => prev + 1)
  }

  const handleScheduleNew = (date: Date) => {
    setSelectedScheduleDate(date)
    setShowSchedulingModal(true)
  }

  const handlePostSelect = (post: {
    id: string
    clipId: number
    platform: string
    scheduledTime: Date
    status: 'pending' | 'published' | 'failed'
    title: string
    thumbnailUrl?: string
  }) => {
    console.log('Selected post:', post)
    // Could open a detail modal here
  }

  const handleSchedule = async (scheduleData: {
    clipId: number
    platforms: string[]
    scheduledTime: Date
    title: string
    description: string
    hashtags: string[]
    customizations: Record<string, unknown>
  }) => {
    try {
      // Call API to schedule the post
      const response = await fetch('/api/social/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      })

      if (response.ok) {
        // Refresh scheduled posts
        fetchScheduledPosts()
        setShowSchedulingModal(false)
      }
    } catch (error) {
      console.error('Error scheduling post:', error)
    }
  }

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/social/posts')
      if (response.ok) {
        const data = await response.json()
        setScheduledPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
    }
  }

  const sidebarNavigation = [
    { name: 'Dashboard', href: 'dashboard', icon: HomeIcon },
    { name: 'Videos', href: 'uploads', icon: VideoCameraIcon },
    { name: 'Clips', href: 'clips', icon: ScissorsIcon },
    { name: 'AI Enhancement', href: 'ai', icon: SparklesIcon },
    { name: 'Calendar', href: 'calendar', icon: CalendarIcon },
    { name: 'Analytics', href: 'analytics', icon: ChartBarIcon },
    { name: 'Workflows', href: 'workflows', icon: Cog6ToothIcon },
  ]

  const bottomNavigation = [
    { name: 'Profile', href: 'profile', icon: UserIcon },
    { name: 'Billing', href: 'pricing', icon: CreditCardIcon },
  ]

  const stats = [
    { name: 'Generated', value: '247', change: '+12%', icon: ScissorsIcon, color: 'text-primary' },
    { name: 'Published', value: '189', change: '+8%', icon: PlayIcon, color: 'text-accent-success' },
    { name: 'Scheduled', value: '23', change: '+15%', icon: ClockIcon, color: 'text-primary' },
    { name: 'Storage', value: '4.2GB', change: '+2%', icon: CircleStackIcon, color: 'text-accent-warning' },
  ]

  const recentMetrics = [
    { name: 'Total Views', value: '12.4K', icon: EyeIcon, trend: '+18%' },
    { name: 'Engagement', value: '8.2%', icon: HeartIcon, trend: '+5%' },
    { name: 'Shares', value: '342', icon: ShareIcon, trend: '+23%' },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-primary to-primary-hover">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">C</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-foreground">ContentWizard</h1>
                  </div>
                </div>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {sidebarNavigation.map((item) => {
                  const isActive = activeTab === item.href
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.href)
                        setSidebarOpen(false)
                      }}
                      className={`${
                        isActive
                          ? 'bg-primary-hover border-r-2 border-primary-light text-foreground'
                          : 'text-muted hover:bg-primary-hover hover:text-foreground'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-200`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-primary-light' : 'text-muted'
                        } mr-3 flex-shrink-0 h-5 w-5`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </button>
                  )
                })}
              </nav>
              <div className="mt-6 pt-6 border-t border-primary-dark">
                <nav className="px-2 space-y-1">
                  {bottomNavigation.map((item) => {
                    const isActive = activeTab === item.href
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveTab(item.href)
                          setSidebarOpen(false)
                        }}
                        className={`${
                          isActive
                            ? 'bg-primary-hover border-r-2 border-primary-light text-foreground'
                            : 'text-muted hover:bg-primary-hover hover:text-foreground'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-200`}
                      >
                        <item.icon
                          className={`${
                            isActive ? 'text-primary-light' : 'text-muted'
                          } mr-3 flex-shrink-0 h-5 w-5`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-gradient-to-b from-primary to-primary-hover overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">C</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-foreground">ContentWizard</h1>
              </div>
            </div>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {sidebarNavigation.map((item) => {
                const isActive = activeTab === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveTab(item.href)}
                    className={`${
                      isActive
                        ? 'bg-primary-hover border-r-2 border-primary-light text-foreground'
                        : 'text-muted hover:bg-primary-hover hover:text-foreground'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-200`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-primary-light' : 'text-muted'
                      } mr-3 flex-shrink-0 h-5 w-5`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </button>
                )
              })}
            </nav>
            <div className="px-2 space-y-1 pb-4">
              <div className="border-t border-primary-dark pt-4">
                {bottomNavigation.map((item) => {
                  const isActive = activeTab === item.href
                  return (
                    <button
                      key={item.name}
                      onClick={() => setActiveTab(item.href)}
                      className={`${
                        isActive
                          ? 'bg-primary-hover border-r-2 border-primary-light text-foreground'
                          : 'text-muted hover:bg-primary-hover hover:text-foreground'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-200`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-primary-light' : 'text-muted'
                        } mr-3 flex-shrink-0 h-5 w-5`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top nav */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-surface shadow-sm">
          <button
            type="button"
            className="px-4 border-r border-border text-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <div className="relative w-full text-muted focus-within:text-foreground">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="search-field"
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-foreground placeholder-muted focus:outline-none focus:placeholder-muted-foreground focus:ring-0 focus:border-transparent sm:text-sm bg-transparent"
                    placeholder="Search videos, clips, or workflows..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button
                type="button"
                className="bg-surface p-1 rounded-full text-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {session?.user?.image ? (
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt="User avatar"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="h-8 w-8 bg-surface rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-foreground">{session?.user?.name}</div>
                    <div className="text-xs text-muted">Free Plan</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Good morning, {session?.user?.name?.split(' ')[0] || 'Creator'}</h1>
                    <p className="mt-1 text-sm text-muted">
                      Here&apos;s what&apos;s happening with your content today.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item) => (
                      <div key={item.name} className="bg-surface overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-muted truncate">{item.name}</dt>
                                <dd>
                                  <div className="text-lg font-medium text-foreground">{item.value}</div>
                                </dd>
                              </dl>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center text-sm">
                              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-600 font-medium">{item.change}</span>
                              <span className="text-muted ml-1">from last month</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-surface shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <button
                          onClick={() => setShowVideoUpload(true)}
                          className="relative block w-full border-2 border-border border-dashed rounded-lg p-6 text-center hover:border-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        >
                          <CloudArrowUpIcon className="mx-auto h-8 w-8 text-muted" />
                          <span className="mt-2 block text-sm font-medium text-foreground">Upload Video</span>
                          <span className="mt-1 block text-xs text-muted">Upload a new video to get started</span>
                        </button>
                        <button
                          onClick={() => handleCreateClip()}
                          className="relative block w-full border-2 border-border border-dashed rounded-lg p-6 text-center hover:border-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        >
                          <ScissorsIcon className="mx-auto h-8 w-8 text-muted" />
                          <span className="mt-2 block text-sm font-medium text-foreground">Create Clip</span>
                          <span className="mt-1 block text-xs text-muted">Generate clips from your videos</span>
                        </button>
                        <button
                          disabled
                          className="relative block w-full border-2 border-border border-dashed rounded-lg p-6 text-center opacity-50 cursor-not-allowed"
                        >
                          <CalendarIcon className="mx-auto h-8 w-8 text-muted" />
                          <span className="mt-2 block text-sm font-medium text-foreground">Schedule Post</span>
                          <span className="mt-1 block text-xs text-muted">Coming soon</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Performance Insights */}
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="bg-surface shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Performance Insights</h3>
                        <div className="space-y-4">
                          {recentMetrics.map((metric) => (
                            <div key={metric.name} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <metric.icon className="h-5 w-5 text-muted mr-3" />
                                <span className="text-sm font-medium text-foreground">{metric.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-semibold text-foreground mr-2">{metric.value}</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {metric.trend}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-foreground mb-4">Recent Activity</h3>
                        <div className="flow-root">
                          <ul className="-mb-8">
                            <li>
                              <div className="relative pb-8">
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ring-8 ring-surface">
                                      <ScissorsIcon className="h-4 w-4 text-foreground" aria-hidden="true" />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-muted">
                                        Created new clip <span className="font-medium text-foreground">&quot;Best Moments&quot;</span>
                                      </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-muted">
                                      2h ago
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                            <li>
                              <div className="relative pb-8">
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-surface">
                                      <CloudArrowUpIcon className="h-4 w-4 text-foreground" aria-hidden="true" />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-muted">
                                        Uploaded video <span className="font-medium text-foreground">&quot;Tutorial #5&quot;</span>
                                      </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-muted">
                                      5h ago
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'uploads' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-semibold text-foreground">Video Library</h1>
                      <p className="mt-1 text-sm text-muted">
                        Manage and organize your uploaded videos
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        variant="outline"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </Button>
                      <Button 
                        onClick={() => setShowVideoUpload(true)}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Upload Video
                      </Button>
                    </div>
                  </div>
                  
                  {showVideoUpload ? (
                    <div className="bg-surface shadow rounded-lg p-6">
                      <VideoUpload onUploadComplete={handleUploadComplete} />
                    </div>
                  ) : (
                    <VideoList 
                      key={refreshKey} 
                      onCreateClip={handleCreateClip} 
                      onRefresh={() => setRefreshKey(prev => prev + 1)}
                      onUploadClick={() => setShowVideoUpload(true)}
                    />
                  )}
                </div>
              )}

              {activeTab === 'clips' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-semibold text-foreground">Generated Clips</h1>
                      <p className="mt-1 text-sm text-muted">
                        View and manage your AI-generated video clips
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => setClipRefreshKey(prev => prev + 1)}
                        variant="outline"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </Button>
                      <Button 
                        onClick={() => handleCreateClip()}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Clip
                      </Button>
                    </div>
                  </div>
                  
                  <ClipList 
                    key={clipRefreshKey} 
                    onRefresh={() => setClipRefreshKey(prev => prev + 1)}
                    onCreateClip={() => handleCreateClip()}
                  />
                </div>
              )}

              {activeTab === 'workflows' && (
                <WorkflowBuilder />
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">AI Enhancement Suite</h1>
                    <p className="mt-1 text-sm text-muted">
                      Leverage AI to automatically generate optimized metadata for your content
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="xl:col-span-1">
                      <AIMetadataEnhancer />
                    </div>
                    <div className="xl:col-span-1">
                      <BatchAIProcessor 
                        items={[]}
                        onComplete={(results) => {
                          console.log('Batch processing completed:', results)
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Publishing Calendar</h1>
                    <p className="mt-1 text-sm text-muted">
                      Schedule and manage your content across all platforms
                    </p>
                  </div>
                  
                  <CalendarWidget
                    scheduledPosts={scheduledPosts}
                    onDateSelect={setSelectedScheduleDate}
                    onPostSelect={handlePostSelect}
                    onScheduleNew={handleScheduleNew}
                  />
                </div>
              )}

              {activeTab === 'analytics' && (
                <AnalyticsDashboard />
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Profile & Settings</h1>
                    <p className="mt-1 text-sm text-muted">
                      Manage your account information, social connections, and preferences
                    </p>
                  </div>

                  {/* Profile Sub-Navigation */}
                  <div className="bg-surface shadow rounded-lg overflow-hidden">
                    <div className="border-b border-border">
                      <nav className="-mb-px flex space-x-8 px-6" aria-label="Profile tabs">
                        <button
                          onClick={() => setProfileTab('settings')}
                          className={`${
                            profileTab === 'settings'
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted hover:text-foreground hover:border-border'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                          Account Settings
                        </button>
                        <button
                          onClick={() => setProfileTab('connections')}
                          className={`${
                            profileTab === 'connections'
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted hover:text-foreground hover:border-border'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                          Social Connections
                        </button>
                      </nav>
                    </div>

                    <div className="p-6">
                      {profileTab === 'settings' && (
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-foreground">Full Name</label>
                            <input
                              type="text"
                              value={session?.user?.name || ''}
                              disabled
                              className="mt-1 block w-full border-border rounded-md shadow-sm bg-surface text-muted sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground">Email Address</label>
                            <input
                              type="email"
                              value={session?.user?.email || ''}
                              disabled
                              className="mt-1 block w-full border-border rounded-md shadow-sm bg-surface text-muted sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground">Profile Picture</label>
                            <div className="mt-1 flex items-center space-x-4">
                              {session?.user?.image ? (
                                <Image
                                  src={session.user.image}
                                  alt="Profile"
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="h-12 w-12 bg-surface rounded-full flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-muted" />
                                </div>
                              )}
                              <Button disabled size="sm" variant="outline">
                                Change Picture
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === 'connections' && (
                        <div className="-m-6">
                          <SocialConnections />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Subscription & Billing</h1>
                    <p className="mt-1 text-sm text-muted">
                      Manage your subscription and billing information
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="bg-surface border rounded-lg p-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-foreground">Free</h3>
                        <div className="mt-2 text-3xl font-bold text-foreground">$0<span className="text-sm text-muted font-normal">/month</span></div>
                        <ul className="mt-4 text-sm text-muted space-y-2">
                          <li>• Up to 5 videos</li>
                          <li>• Basic clip creation</li>
                          <li>• Standard quality</li>
                        </ul>
                        <Button variant="outline" disabled className="w-full mt-6">
                          Current Plan
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-primary/10 to-primary/20 border-2 border-primary rounded-lg p-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-foreground">Pro</h3>
                        <div className="mt-2 text-3xl font-bold text-foreground">$29<span className="text-sm text-muted font-normal">/month</span></div>
                        <ul className="mt-4 text-sm text-muted space-y-2">
                          <li>• Unlimited videos</li>
                          <li>• AI-powered features</li>
                          <li>• HD quality exports</li>
                          <li>• Social media scheduling</li>
                        </ul>
                        <Button disabled className="w-full mt-6">
                          Coming Soon
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-surface border rounded-lg p-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-foreground">Enterprise</h3>
                        <div className="mt-2 text-3xl font-bold text-foreground">$99<span className="text-sm text-muted font-normal">/month</span></div>
                        <ul className="mt-4 text-sm text-muted space-y-2">
                          <li>• Everything in Pro</li>
                          <li>• Team collaboration</li>
                          <li>• White-label options</li>
                          <li>• Priority support</li>
                        </ul>
                        <Button variant="outline" disabled className="w-full mt-6">
                          Contact Sales
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <EnhancedCreateClipModal
        isOpen={showCreateClipModal}
        onClose={() => setShowCreateClipModal(false)}
        video={selectedVideo}
        onClipsCreated={handleClipCreated}
      />

      <SchedulingModal
        open={showSchedulingModal}
        onClose={() => setShowSchedulingModal(false)}
        selectedDate={selectedScheduleDate}
        platforms={platforms}
        onSchedule={handleSchedule}
      />
    </div>
  )
}
