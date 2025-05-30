'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { VideoUpload } from './video-upload'
import { VideoList } from './video-list'
import { ClipList } from './clip-list'
import { EnhancedCreateClipModal } from './enhanced-create-clip-modal'
import { SocialConnections } from './social-connections'
import { SchedulingCalendar } from './scheduling-calendar'
import { WorkflowBuilder } from './workflow-builder'
import { AnalyticsDashboard } from './analytics-dashboard-refactored'
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
  XMarkIcon
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

  const sidebarNavigation = [
    { name: 'Dashboard', href: 'dashboard', icon: HomeIcon },
    { name: 'Videos', href: 'uploads', icon: VideoCameraIcon },
    { name: 'Clips', href: 'clips', icon: ScissorsIcon },
    { name: 'Calendar', href: 'calendar', icon: CalendarIcon },
    { name: 'Analytics', href: 'analytics', icon: ChartBarIcon },
    { name: 'Workflows', href: 'workflows', icon: Cog6ToothIcon },
  ]

  const bottomNavigation = [
    { name: 'Profile', href: 'profile', icon: UserIcon },
    { name: 'Billing', href: 'pricing', icon: CreditCardIcon },
  ]

  const stats = [
    { name: 'Generated', value: '247', change: '+12%', icon: ScissorsIcon, color: 'text-purple-600' },
    { name: 'Published', value: '189', change: '+8%', icon: PlayIcon, color: 'text-green-600' },
    { name: 'Scheduled', value: '23', change: '+15%', icon: ClockIcon, color: 'text-blue-600' },
    { name: 'Storage', value: '4.2GB', change: '+2%', icon: CircleStackIcon, color: 'text-orange-600' },
  ]

  const recentMetrics = [
    { name: 'Total Views', value: '12.4K', icon: EyeIcon, trend: '+18%' },
    { name: 'Engagement', value: '8.2%', icon: HeartIcon, trend: '+5%' },
    { name: 'Shares', value: '342', icon: ShareIcon, trend: '+23%' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-purple-900 to-purple-800">
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
                    <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-lg">C</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-white">ContentWizard</h1>
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
                          ? 'bg-purple-800 border-r-2 border-purple-300 text-white'
                          : 'text-purple-100 hover:bg-purple-800 hover:text-white'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-200`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-purple-200' : 'text-purple-300'
                        } mr-3 flex-shrink-0 h-5 w-5`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </button>
                  )
                })}
              </nav>
              <div className="mt-6 pt-6 border-t border-purple-700">
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
                            ? 'bg-purple-800 border-r-2 border-purple-300 text-white'
                            : 'text-purple-100 hover:bg-purple-800 hover:text-white'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-200`}
                      >
                        <item.icon
                          className={`${
                            isActive ? 'text-purple-200' : 'text-purple-300'
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
        <div className="flex flex-col flex-grow pt-5 bg-gradient-to-b from-purple-900 to-purple-800 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">C</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">ContentWizard</h1>
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
                        ? 'bg-purple-800 border-r-2 border-purple-300 text-white'
                        : 'text-purple-100 hover:bg-purple-800 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-200`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-purple-200' : 'text-purple-300'
                      } mr-3 flex-shrink-0 h-5 w-5`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </button>
                )
              })}
            </nav>
            <div className="px-2 space-y-1 pb-4">
              <div className="border-t border-purple-700 pt-4">
                {bottomNavigation.map((item) => {
                  const isActive = activeTab === item.href
                  return (
                    <button
                      key={item.name}
                      onClick={() => setActiveTab(item.href)}
                      className={`${
                        isActive
                          ? 'bg-purple-800 border-r-2 border-purple-300 text-white'
                          : 'text-purple-100 hover:bg-purple-800 hover:text-white'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors duration-200`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-purple-200' : 'text-purple-300'
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
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 md:hidden"
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
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="search-field"
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Search videos, clips, or workflows..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-700">{session?.user?.name}</div>
                    <div className="text-xs text-gray-500">Free Plan</div>
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
                    <h1 className="text-2xl font-semibold text-gray-900">Good morning, {session?.user?.name?.split(' ')[0] || 'Creator'}</h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Here&apos;s what&apos;s happening with your content today.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((item) => (
                      <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                <dd>
                                  <div className="text-lg font-medium text-gray-900">{item.value}</div>
                                </dd>
                              </dl>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center text-sm">
                              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-600 font-medium">{item.change}</span>
                              <span className="text-gray-500 ml-1">from last month</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <button
                          onClick={() => setShowVideoUpload(true)}
                          className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                        >
                          <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="mt-2 block text-sm font-medium text-gray-900">Upload Video</span>
                          <span className="mt-1 block text-xs text-gray-500">Upload a new video to get started</span>
                        </button>
                        <button
                          onClick={() => handleCreateClip()}
                          className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                        >
                          <ScissorsIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="mt-2 block text-sm font-medium text-gray-900">Create Clip</span>
                          <span className="mt-1 block text-xs text-gray-500">Generate clips from your videos</span>
                        </button>
                        <button
                          disabled
                          className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center opacity-50 cursor-not-allowed"
                        >
                          <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="mt-2 block text-sm font-medium text-gray-900">Schedule Post</span>
                          <span className="mt-1 block text-xs text-gray-500">Coming soon</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Performance Insights */}
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Performance Insights</h3>
                        <div className="space-y-4">
                          {recentMetrics.map((metric) => (
                            <div key={metric.name} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <metric.icon className="h-5 w-5 text-gray-400 mr-3" />
                                <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-semibold text-gray-900 mr-2">{metric.value}</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {metric.trend}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                        <div className="flow-root">
                          <ul className="-mb-8">
                            <li>
                              <div className="relative pb-8">
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                                      <ScissorsIcon className="h-4 w-4 text-white" aria-hidden="true" />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Created new clip <span className="font-medium text-gray-900">&quot;Best Moments&quot;</span>
                                      </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
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
                                    <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                      <CloudArrowUpIcon className="h-4 w-4 text-white" aria-hidden="true" />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Uploaded video <span className="font-medium text-gray-900">&quot;Tutorial #5&quot;</span>
                                      </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
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
                      <h1 className="text-2xl font-semibold text-gray-900">Video Library</h1>
                      <p className="mt-1 text-sm text-gray-600">
                        Manage and organize your uploaded videos
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </Button>
                      <Button 
                        onClick={() => setShowVideoUpload(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Upload Video
                      </Button>
                    </div>
                  </div>
                  
                  {showVideoUpload ? (
                    <div className="bg-white shadow rounded-lg p-6">
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
                      <h1 className="text-2xl font-semibold text-gray-900">Generated Clips</h1>
                      <p className="mt-1 text-sm text-gray-600">
                        View and manage your AI-generated video clips
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => setClipRefreshKey(prev => prev + 1)}
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </Button>
                      <Button 
                        onClick={() => handleCreateClip()}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
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
              )}              {activeTab === 'calendar' && (
                <SchedulingCalendar />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsDashboard />
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Profile & Settings</h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Manage your account information, social connections, and preferences
                    </p>
                  </div>

                  {/* Profile Sub-Navigation */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8 px-6" aria-label="Profile tabs">
                        <button
                          onClick={() => setProfileTab('settings')}
                          className={`${
                            profileTab === 'settings'
                              ? 'border-purple-500 text-purple-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                          Account Settings
                        </button>
                        <button
                          onClick={() => setProfileTab('connections')}
                          className={`${
                            profileTab === 'connections'
                              ? 'border-purple-500 text-purple-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                              type="text"
                              value={session?.user?.name || ''}
                              disabled
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                              type="email"
                              value={session?.user?.email || ''}
                              disabled
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
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
                                <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-gray-500" />
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
                    <h1 className="text-2xl font-semibold text-gray-900">Subscription & Billing</h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Manage your subscription and billing information
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="bg-white border rounded-lg p-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                        <div className="mt-2 text-3xl font-bold text-gray-900">$0<span className="text-sm text-gray-500 font-normal">/month</span></div>
                        <ul className="mt-4 text-sm text-gray-600 space-y-2">
                          <li>• Up to 5 videos</li>
                          <li>• Basic clip creation</li>
                          <li>• Standard quality</li>
                        </ul>
                        <Button variant="outline" disabled className="w-full mt-6">
                          Current Plan
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
                        <div className="mt-2 text-3xl font-bold text-gray-900">$29<span className="text-sm text-gray-500 font-normal">/month</span></div>
                        <ul className="mt-4 text-sm text-gray-600 space-y-2">
                          <li>• Unlimited videos</li>
                          <li>• AI-powered features</li>
                          <li>• HD quality exports</li>
                          <li>• Social media scheduling</li>
                        </ul>
                        <Button disabled className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white">
                          Coming Soon
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-lg p-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
                        <div className="mt-2 text-3xl font-bold text-gray-900">$99<span className="text-sm text-gray-500 font-normal">/month</span></div>
                        <ul className="mt-4 text-sm text-gray-600 space-y-2">
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
    </div>
  )
}
