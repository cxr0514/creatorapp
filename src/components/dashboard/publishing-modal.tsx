'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  SOCIAL_PLATFORMS, 
  // getPlatformGuidelines, // TODO: Use when implementing platform-specific validation
  validateContentForPlatform, 
  formatContentForPlatform,
  // type SocialPlatform, // TODO: Use when implementing platform-specific features
  type PostContent,
  type SocialAccount
} from '@/lib/social-publishing'

interface PublishResult {
  platform: string
  success: boolean
  data?: PostContent
  error?: string
}

interface Clip {
  id: number
  title: string
  description?: string
  hashtags?: string[]
  aspectRatio?: string
  duration?: number
  thumbnailUrl?: string
}

interface PublishingModalProps {
  clip: Clip
  isOpen: boolean
  onClose: () => void
  onPublishComplete: (results: PublishResult[]) => void
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function PublishingModal({ clip, isOpen, onClose, onPublishComplete }: PublishingModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([])
  const [postContent, setPostContent] = useState<PostContent>({
    title: clip.title,
    description: clip.description || '',
    hashtags: clip.hashtags || [],
    videoUrl: '',
    thumbnailUrl: clip.thumbnailUrl
  })
  const [scheduleMode, setScheduleMode] = useState<'immediate' | 'schedule'>('immediate')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})
  // const [showAdvanced, setShowAdvanced] = useState(false) // TODO: Use when implementing advanced options

  useEffect(() => {
    if (isOpen) {
      fetchConnectedAccounts()
      // Reset form
      setSelectedPlatforms(new Set())
      setPostContent({
        title: clip.title,
        description: clip.description || '',
        hashtags: clip.hashtags || [],
        videoUrl: '',
        thumbnailUrl: clip.thumbnailUrl
      })
      setScheduleMode('immediate')
      setScheduledTime('')
      setValidationResults({})
    }
  }, [isOpen, clip])

  useEffect(() => {
    // Validate content for selected platforms
    const results: Record<string, ValidationResult> = {}
    selectedPlatforms.forEach(platformId => {
      const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId)
      if (platform) {
        results[platformId] = validateContentForPlatform(postContent, platform)
      }
    })
    setValidationResults(results)
  }, [postContent, selectedPlatforms])

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch('/api/social/connections')
      if (response.ok) {
        const data = await response.json()
        setConnectedAccounts(data.connections)
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error)
    }
  }

  const togglePlatform = (platformId: string) => {
    const newSelected = new Set(selectedPlatforms)
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId)
    } else {
      newSelected.add(platformId)
    }
    setSelectedPlatforms(newSelected)
  }

  const handleContentChange = (field: keyof PostContent, value: string | string[] | undefined) => {
    setPostContent(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleHashtagsChange = (hashtagsString: string) => {
    const hashtags = hashtagsString
      .split(/[,\s]+/)
      .map(tag => tag.replace('#', '').trim())
      .filter(tag => tag.length > 0)
    handleContentChange('hashtags', hashtags)
  }

  const connectPlatform = async (platformId: string) => {
    try {
      const response = await fetch('/api/social/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`Would redirect to: ${data.authUrl}`)
        // In real implementation, would redirect to OAuth flow
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
    }
  }

  const handlePublish = async () => {
    if (selectedPlatforms.size === 0) {
      alert('Please select at least one platform')
      return
    }

    // Check for validation errors
    const hasErrors = Object.values(validationResults).some(result => !result.valid)
    if (hasErrors) {
      alert('Please fix validation errors before publishing')
      return
    }

    setIsPublishing(true)

    try {
      const publishPromises = Array.from(selectedPlatforms).map(async (platformId): Promise<PublishResult | null> => {
        const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId)
        if (!platform) return null

        const formattedContent = formatContentForPlatform(postContent, platform)
        
        const scheduleTime = scheduleMode === 'schedule' && scheduledTime 
          ? new Date(scheduledTime)
          : new Date()

        const response = await fetch('/api/social/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clipId: clip.id,
            platform: platformId,
            accountId: connectedAccounts.find(acc => acc.platform === platformId)?.accountId || 'mock-account',
            scheduledTime: scheduleTime.toISOString(),
            title: formattedContent.title,
            description: formattedContent.description,
            hashtags: formattedContent.hashtags,
            videoUrl: `https://example.com/clips/${clip.id}.mp4`, // Mock URL
            thumbnailUrl: formattedContent.thumbnailUrl
          })
        })

        if (response.ok) {
          const data = await response.json()
          return { platform: platformId, success: true, data }
        } else {
          const error = await response.json()
          return { platform: platformId, success: false, error: error.error }
        }
      })

      const publishResults = await Promise.all(publishPromises)
      const results = publishResults.filter((result): result is PublishResult => result !== null)
      const successCount = results.filter(r => r.success).length
      
      alert(`Successfully ${scheduleMode === 'immediate' ? 'published' : 'scheduled'} to ${successCount}/${results.length} platforms`)
      onPublishComplete(results)
      onClose()
    } catch (error) {
      console.error('Error publishing:', error)
      alert('Failed to publish content')
    } finally {
      setIsPublishing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Publish to Social Media</h2>
            <Button 
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <p className="text-gray-600 mt-2">Publishing: {clip.title}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Platforms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SOCIAL_PLATFORMS.map((platform) => {
                const account = connectedAccounts.find(acc => acc.platform === platform.id)
                const isSelected = selectedPlatforms.has(platform.id)
                const isConnected = account?.isConnected || false

                return (
                  <div key={platform.id} className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{platform.name[0].toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{platform.displayName}</span>
                      </div>
                      {isConnected ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePlatform(platform.id)}
                          className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => connectPlatform(platform.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Max: {platform.maxFileSize}MB, {Math.floor(platform.maxDuration / 60)}min</p>
                      <p>Formats: {platform.supportedFormats.join(', ')}</p>
                      {!isConnected && (
                        <p className="text-red-600 mt-1">Not connected</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Content Configuration */}
          {selectedPlatforms.size > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Content Settings</h3>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={postContent.title}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter post title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={postContent.description}
                  onChange={(e) => handleContentChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter post description..."
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                <input
                  type="text"
                  value={postContent.hashtags?.join(', ') || ''}
                  onChange={(e) => handleHashtagsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="trending, viral, content (comma separated)"
                />
              </div>

              {/* Validation Results */}
              {Object.keys(validationResults).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(validationResults).map(([platformId, result]) => {
                    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId)
                    if (!platform) return null

                    return (
                      <div key={platformId} className={`p-3 rounded-lg border ${
                        result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{platform.displayName}</span>
                          {result.valid ? (
                            <span className="text-green-600 text-xs">✓ Valid</span>
                          ) : (
                            <span className="text-red-600 text-xs">✗ Invalid</span>
                          )}
                        </div>
                        {result.errors?.length > 0 && (
                          <ul className="text-sm text-red-600 space-y-1">
                            {result.errors.map((error: string, i: number) => (
                              <li key={i}>• {error}</li>
                            ))}
                          </ul>
                        )}
                        {result.warnings?.length > 0 && (
                          <ul className="text-sm text-yellow-600 space-y-1">
                            {result.warnings.map((warning: string, i: number) => (
                              <li key={i}>⚠ {warning}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Scheduling */}
          {selectedPlatforms.size > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Scheduling</h3>
              
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="immediate"
                    checked={scheduleMode === 'immediate'}
                    onChange={(e) => setScheduleMode(e.target.value as 'immediate')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Publish Now</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="schedule"
                    checked={scheduleMode === 'schedule'}
                    onChange={(e) => setScheduleMode(e.target.value as 'schedule')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Schedule for Later</span>
                </label>
              </div>

              {scheduleMode === 'schedule' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedPlatforms.size > 0 && (
                <span>Publishing to {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={selectedPlatforms.size === 0 || isPublishing}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {scheduleMode === 'immediate' ? 'Publishing...' : 'Scheduling...'}
                  </>
                ) : (
                  <>{scheduleMode === 'immediate' ? 'Publish Now' : 'Schedule Post'}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
