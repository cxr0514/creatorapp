'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { VideoUpload } from './video-upload-enhanced'
import { VideoList } from './video-list'

import {
  HomeIcon,
  VideoCameraIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  PlayIcon,
  ClockIcon,
  CircleStackIcon,
  BellIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

export function Dashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'uploads' | 'calendar' | 'analytics' | 'workflows' | 'profile' | 'pricing'>('uploads')
  const [showVideoUpload, setShowVideoUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    setShowVideoUpload(false)
    setRefreshKey((prev) => prev + 1)
  }

  const sidebarNavigation = [
    { name: 'Dashboard', href: 'dashboard', icon: HomeIcon },
    { name: 'Videos', href: 'uploads', icon: VideoCameraIcon },
    { name: 'Calendar', href: 'calendar', icon: CalendarIcon },
    { name: 'Analytics', href: 'analytics', icon: ChartBarIcon },
    { name: 'Workflows', href: 'workflows', icon: Cog6ToothIcon },
  ] as const

  const bottomNavigation = [
    { name: 'Profile', href: 'profile', icon: UserIcon },
    { name: 'Billing', href: 'pricing', icon: CreditCardIcon },
  ] as const

  const stats = [
    { name: 'Videos', value: '247', change: '+12%', icon: VideoCameraIcon, color: 'text-purple-600' },
    { name: 'Published', value: '189', change: '+8%', icon: PlayIcon, color: 'text-green-600' },
    { name: 'Scheduled', value: '23', change: '+15%', icon: ClockIcon, color: 'text-blue-600' },
    { name: 'Storage', value: '4.2GB', change: '+2%', icon: CircleStackIcon, color: 'text-orange-600' },
  ] as const

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
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
                      className={`${isActive ? 'text-purple-200' : 'text-purple-300'} mr-3 flex-shrink-0 h-5 w-5`}
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
                        className={`${isActive ? 'text-purple-200' : 'text-purple-300'} mr-3 flex-shrink-0 h-5 w-5`}
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
                    placeholder="Search videos or workflows..."
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
                    <h1 className="text-2xl font-semibold text-gray-900">
                      Good morning, {session?.user?.name?.split(' ')[0] || 'Creator'}
                    </h1>
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
                </div>
              )}

              {/* Tab content */}
              <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard</h2>
                  <p className="text-gray-600">Transform your videos into engaging content</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab('uploads')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === 'uploads'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Uploads
                      </button>
                      <button
                        onClick={() => setActiveTab('calendar')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === 'calendar'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Calendar
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === 'analytics'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Analytics
                      </button>
                      <button
                        onClick={() => setActiveTab('workflows')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === 'workflows'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Workflows
                      </button>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === 'profile'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setActiveTab('pricing')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === 'pricing'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Pricing
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === 'uploads' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">Uploaded Videos</h3>
                          <Button onClick={() => setShowVideoUpload(true)}>
                            Upload Video
                          </Button>
                        </div>
                        
                        {showVideoUpload ? (
                          <VideoUpload onUploadComplete={handleUploadComplete} />
                        ) : (
                          <VideoList key={refreshKey} />
                        )}
                      </div>
                    )}

                    {activeTab === 'calendar' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">Scheduled Posts</h3>
                          <Button disabled>
                            Schedule Post
                          </Button>
                        </div>
                        
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Calendar Feature Coming Soon</h4>
                            <p className="text-gray-600">Schedule and manage your social media posts</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'analytics' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">Performance Analytics</h3>
                          <Button disabled>
                            Export Report
                          </Button>
                        </div>
                        
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard Coming Soon</h4>
                            <p className="text-gray-600">Track views, engagement, and performance metrics</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'workflows' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">Automation Workflows</h3>
                          <Button disabled>
                            Create Workflow
                          </Button>
                        </div>
                        
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Workflow Builder Coming Soon</h4>
                            <p className="text-gray-600">Automate your content creation and publishing process</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'profile' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
                          <Button disabled>
                            Save Changes
                          </Button>
                        </div>
                        
                        <div className="max-w-2xl">
                          <div className="bg-white border rounded-lg p-6">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                  type="text"
                                  value={session?.user?.name || ''}
                                  disabled
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                  type="email"
                                  value={session?.user?.email || ''}
                                  disabled
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                                <div className="flex items-center space-x-4">
                                  {session?.user?.image && (
                                    <div className="relative h-12 w-12">
                                      <Image
                                        src={session.user.image}
                                        alt="Profile"
                                        fill
                                        className="rounded-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <Button disabled size="sm" variant="outline">
                                    Change Picture
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'pricing' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">Subscription & Pricing</h3>
                          <Button disabled>
                            Upgrade Plan
                          </Button>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="border rounded-lg p-6 bg-white">
                            <div className="text-center">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">Free</h4>
                              <div className="text-3xl font-bold text-gray-900 mb-4">$0<span className="text-sm text-gray-500 font-normal">/month</span></div>
                              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                                <li>• Up to 5 videos</li>
                                <li>• Basic video features</li>
                                <li>• Standard quality</li>
                              </ul>
                              <Button variant="outline" disabled className="w-full">
                                Current Plan
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
                            <div className="text-center">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">Pro</h4>
                              <div className="text-3xl font-bold text-gray-900 mb-4">$29<span className="text-sm text-gray-500 font-normal">/month</span></div>
                              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                                <li>• Unlimited videos</li>
                                <li>• AI-powered features</li>
                                <li>• HD quality exports</li>
                                <li>• Social media scheduling</li>
                              </ul>
                              <Button disabled className="w-full">
                                Coming Soon
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-6 bg-white">
                            <div className="text-center">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">Enterprise</h4>
                              <div className="text-3xl font-bold text-gray-900 mb-4">$99<span className="text-sm text-gray-500 font-normal">/month</span></div>
                              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                                <li>• Everything in Pro</li>
                                <li>• Team collaboration</li>
                                <li>• White-label options</li>
                                <li>• Priority support</li>
                              </ul>
                              <Button variant="outline" disabled className="w-full">
                                Contact Sales
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
