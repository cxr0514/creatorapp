'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  SOCIAL_PLATFORMS, 
  validateContentForPlatform, 
  type PostContent,
  type SocialAccount
} from '@/lib/social-publishing'

interface PublishResult {
  platform: string
  success: boolean
  data?: PostContent
  error?: string
  platformPostId?: string
  platformUrl?: string
}

interface Clip {
  id: number
  title: string
  description?: string
  hashtags?: string[]
  aspectRatio?: string
  duration?: number
  thumbnailUrl?: string
  cloudinaryUrl?: string
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

interface ScheduleOptions {
  scheduleNow: boolean
  scheduledTime?: Date
  timezone: string
  useSmartScheduling: boolean
}

export function PublishingModal({ clip, isOpen, onClose, onPublishComplete }: PublishingModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([])
  const [postContent, setPostContent] = useState<PostContent>({
    title: clip.title,
    description: clip.description || '',
    hashtags: clip.hashtags || [],
    videoUrl: clip.cloudinaryUrl || '',
    thumbnailUrl: clip.thumbnailUrl
  })
  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOptions>({
    scheduleNow: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    useSmartScheduling: false
  })
  const [smartRecommendations, setSmartRecommendations] = useState<Array<{
    datetime: Date
    confidence: number
    reason: string
    platform: string
    timezone: string
  }>>([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})
  const [publishMode, setPublishMode] = useState<'immediate' | 'schedule' | 'smart'>('immediate')

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
      setScheduleOptions({
        scheduleNow: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        useSmartScheduling: false
      })
      setSmartRecommendations([])
      setValidationResults({})
      setPublishMode('immediate')
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

  useEffect(() => {
    // Fetch smart scheduling recommendations when options change
    const fetchRecommendations = async () => {
      if (scheduleOptions.useSmartScheduling && selectedPlatforms.size > 0) {
        try {
          const platforms = Array.from(selectedPlatforms).join(',')
          const response = await fetch(`/api/social/schedule/recommendations?${new URLSearchParams({
            platforms,
            contentType: 'video',
            timezone: scheduleOptions.timezone,
            daysAhead: '7'
          })}`)
          
          if (response.ok) {
            const data = await response.json()
            setSmartRecommendations(data.recommendations || [])
          }
        } catch (error) {
          console.error('Error fetching smart recommendations:', error)
        }
      } else {
        setSmartRecommendations([])
      }
    }

    fetchRecommendations()
  }, [scheduleOptions, selectedPlatforms])

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

  const fetchSmartRecommendations = async () => {
    if (selectedPlatforms.size === 0) return

    try {
      const platforms = Array.from(selectedPlatforms)
      const response = await fetch(`/api/social/schedule/recommendations?${new URLSearchParams({
        platforms: platforms.join(','),
        contentType: 'video',
        timezone: scheduleOptions.timezone,
        daysAhead: '7'
      })}`)
      
      if (response.ok) {
        const data = await response.json()
        setSmartRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error('Error fetching smart recommendations:', error)
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
    if (selectedPlatforms.size === 0) return

    setIsPublishing(true)
    try {
      const platforms = Array.from(selectedPlatforms)

      if (publishMode === 'immediate') {
        // Publish immediately
        const response = await fetch('/api/social/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clipId: clip.id,
            platforms,
            title: postContent.title,
            description: postContent.description,
            hashtags: postContent.hashtags,
            videoUrl: postContent.videoUrl,
            thumbnailUrl: postContent.thumbnailUrl,
            aspectRatio: clip.aspectRatio || '16:9'
          })
        })

        if (response.ok) {
          const data = await response.json()
          onPublishComplete(data.results)
        } else {
          throw new Error('Publishing failed')
        }
      } else {
        // Schedule for later
        const scheduledTime = scheduleOptions.scheduledTime || new Date()
        
        const response = await fetch('/api/social/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clipId: clip.id,
            platform: platforms[0], // For now, schedule one at a time
            title: postContent.title,
            description: postContent.description,
            hashtags: postContent.hashtags,
            videoUrl: postContent.videoUrl,
            thumbnailUrl: postContent.thumbnailUrl,
            scheduledTime: scheduledTime.toISOString(),
            accountId: 'mock_account'
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Scheduled post created:', data)
          onPublishComplete([{
            platform: platforms[0],
            success: true,
            data: postContent
          }])
        } else {
          throw new Error('Scheduling failed')
        }
      }

      onClose()
    } catch (error) {
      console.error('Publishing error:', error)
      onPublishComplete([{
        platform: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }])
    } finally {
      setIsPublishing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Publish to Social Media</h2>
            <Button 
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">Publishing: {clip.title}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Select Platforms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SOCIAL_PLATFORMS.map((platform) => {
                const account = connectedAccounts.find(acc => acc.platform === platform.id)
                const isSelected = selectedPlatforms.has(platform.id)
                const isConnected = account?.isConnected || false

                return (
                  <div key={platform.id} className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-primary/50 bg-primary/10 ring-2 ring-primary/50' : 'border-border hover:border-border/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{platform.name[0].toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-foreground">{platform.displayName}</span>
                      </div>
                      {isConnected ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePlatform(platform.id)}
                          className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
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
                    <div className="text-sm text-muted-foreground">
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
              <h3 className="text-lg font-semibold text-foreground">Content Settings</h3>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                <input
                  type="text"
                  value={postContent.title}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-primary focus:border-purple-500"
                  placeholder="Enter post title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={postContent.description}
                  onChange={(e) => handleContentChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-primary focus:border-purple-500"
                  placeholder="Enter post description..."
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hashtags</label>
                <input
                  type="text"
                  value={postContent.hashtags?.join(', ') || ''}
                  onChange={(e) => handleHashtagsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-primary focus:border-purple-500"
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
              <h3 className="text-lg font-semibold text-foreground">Scheduling</h3>
              
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="immediate"
                    checked={publishMode === 'immediate'}
                    onChange={(e) => setPublishMode(e.target.value as 'immediate')}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Publish Now</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="schedule"
                    checked={publishMode === 'schedule'}
                    onChange={(e) => setPublishMode(e.target.value as 'schedule')}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Schedule for Later</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="smart"
                    checked={publishMode === 'smart'}
                    onChange={(e) => setPublishMode(e.target.value as 'smart')}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Smart Scheduling</span>
                </label>
              </div>

              {publishMode === 'schedule' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Schedule Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleOptions.scheduledTime?.toISOString().slice(0, 16) || ''}
                    onChange={(e) => setScheduleOptions(prev => ({ ...prev, scheduledTime: new Date(e.target.value) }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="px-3 py-2 border border-border rounded-lg focus:ring-primary focus:border-purple-500"
                  />
                </div>
              )}

              {publishMode === 'smart' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Recommended Times:</p>
                  <ul className="text-sm text-gray-800 space-y-1">
                    {smartRecommendations.length === 0 ? (
                      <li>No recommendations available. Adjust your settings or try again later.</li>
                    ) : (
                      smartRecommendations.map((rec, index) => (
                        <li key={index}>
                          {new Date(rec.datetime).toLocaleString()} - {rec.platform} ({rec.confidence.toFixed(2)} confidence)
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="flex items-center space-x-2 mt-4">
                    <Button
                      onClick={fetchSmartRecommendations}
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Refresh Recommendations
                    </Button>
                    <Button
                      onClick={() => setScheduleOptions(prev => ({ ...prev, scheduleNow: true }))}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                    >
                      Use Recommended Time
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-gray-50 rounded-b-xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
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
                    {publishMode === 'immediate' ? 'Publishing...' : 'Scheduling...'}
                  </>
                ) : (
                  <>{publishMode === 'immediate' ? 'Publish Now' : 'Schedule Post'}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
