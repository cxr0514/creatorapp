'use client'

import { useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { VideoUpload } from './video-upload'
import { VideoList } from './video-list'
import { ClipList } from './clip-list'
import { CreateClipModal } from './create-clip-modal'

export function Dashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('videos')
  const [showVideoUpload, setShowVideoUpload] = useState(false)
  const [showCreateClipModal, setShowCreateClipModal] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<number>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [clipRefreshKey, setClipRefreshKey] = useState(0)

  const handleUploadComplete = (videoId: number) => {
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
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'videos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Videos
              </button>
              <button
                onClick={() => setActiveTab('clips')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clips'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Clips
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'videos' && (
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
