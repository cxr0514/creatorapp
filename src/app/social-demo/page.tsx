'use client'

import { useState } from 'react'
import { SocialLayout } from '@/components/layouts/social-layout'
import { SocialConnectionsEnhanced } from '@/components/dashboard/social-connections-enhanced'
import { PublishingModalEnhanced } from '@/components/dashboard/publishing-modal-enhanced'
import { Button } from '@/components/ui/button'
import { Play, Share } from 'lucide-react'

// Mock video data for demonstration
const mockVideo = {
  id: 1,
  title: "5 AI Tools Every Content Creator Needs",
  description: "Discover the top AI tools that will revolutionize your content creation workflow. From video editing to thumbnail generation, these tools will save you hours of work!",
  hashtags: ["AI", "ContentCreator", "Tools", "Productivity", "VideoEditing"],
  aspectRatio: "16:9",
  duration: 180, // 3 minutes
  thumbnailUrl: "/test_thumbnail_video.mp4", // Using existing test video as placeholder
  videoUrl: "/test_thumbnail_video.mp4"
}

export default function SocialDemoPage() {
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishResults, setPublishResults] = useState<Record<string, unknown> | null>(null)

  const handlePublishComplete = (results: Record<string, unknown>) => {
    setPublishResults(results)
    console.log('Publishing results:', results)
  }

  return (
    <SocialLayout>
      {/* Demo Content Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Demo Content</h2>
        <div className="flex gap-6">
          <div className="w-48 h-28 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <Play className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{mockVideo.title}</h3>
            <p className="text-gray-600 mt-2">{mockVideo.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {mockVideo.hashtags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>Duration: {Math.floor(mockVideo.duration / 60)}:{(mockVideo.duration % 60).toString().padStart(2, '0')}</span>
              <span>Aspect Ratio: {mockVideo.aspectRatio}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowPublishModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              <Share className="w-4 h-4 mr-2" />
              Publish to Social
            </Button>
          </div>
        </div>
      </div>

      {/* API Integration Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Integration Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">OAuth Authentication</span>
            </div>
            <p className="text-sm text-gray-600">Real OAuth flows for YouTube, Twitter, Instagram, LinkedIn, and TikTok</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Live Notifications</span>
            </div>
            <p className="text-sm text-gray-600">Real-time publishing status and analytics updates</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Cross-Platform Publishing</span>
            </div>
            <p className="text-sm text-gray-600">Publish to multiple platforms simultaneously</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Content Validation</span>
            </div>
            <p className="text-sm text-gray-600">Platform-specific content validation and optimization</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Scheduling Support</span>
            </div>
            <p className="text-sm text-gray-600">Schedule posts for optimal engagement times</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Analytics Integration</span>
            </div>
            <p className="text-sm text-gray-600">Track performance across all connected platforms</p>
          </div>
        </div>
      </div>

      {/* Environment Setup Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Setup Instructions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-blue-900">1. API Credentials</h3>
            <p className="text-blue-800">Update your .env.local file with real API credentials from each platform&apos;s developer portal.</p>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">2. OAuth Configuration</h3>
            <p className="text-blue-800">Configure redirect URIs in each platform&apos;s app settings to match your localhost URLs.</p>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">3. Test Connection</h3>
            <p className="text-blue-800">Use the connection interface below to test OAuth flows and verify API integration.</p>
          </div>
        </div>
      </div>

      {/* Social Connections Interface */}
      <SocialConnectionsEnhanced />

      {/* Publishing Results */}
      {publishResults && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Last Publishing Results</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(publishResults, null, 2)}
          </pre>
        </div>
      )}

      {/* Publishing Modal */}
      <PublishingModalEnhanced
        video={mockVideo}
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublishComplete={handlePublishComplete}
      />
    </SocialLayout>
  )
}
