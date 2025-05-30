'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { VideoUpload } from './video-upload'
import { VideoList } from './video-list'
import { ClipList } from './clip-list'
import { CreateClipModal } from './create-clip-modal'

export function Dashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('uploads')
  const [showVideoUpload, setShowVideoUpload] = useState(false)
  const [showCreateClipModal, setShowCreateClipModal] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<number>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [clipRefreshKey, setClipRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    setShowVideoUpload(false)
    // Trigger video list refresh
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateClip = (videoId?: number) => {
    setSelectedVideoId(videoId)
    setShowCreateClipModal(true)
  }

  const handleClipCreated = () => {
    setShowCreateClipModal(false)
    setActiveTab('clips')
    // Trigger clip list refresh
    setClipRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Content Wizard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {session?.user?.name}</span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Transform your videos into engaging clips</p>
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
                onClick={() => setActiveTab('clips')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'clips'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clips
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
                  <VideoList key={refreshKey} onCreateClip={handleCreateClip} />
                )}
              </div>
            )}

            {activeTab === 'clips' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Created Clips</h3>
                  <Button onClick={() => handleCreateClip()}>
                    Create New Clip
                  </Button>
                </div>
                
                <ClipList key={clipRefreshKey} />
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
                        <li>• Basic clip creation</li>
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

      <CreateClipModal
        isOpen={showCreateClipModal}
        onClose={() => setShowCreateClipModal(false)}
        videoId={selectedVideoId}
        onClipCreated={handleClipCreated}
      />
    </div>
  )
}
