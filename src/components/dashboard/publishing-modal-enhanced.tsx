'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlatformIcon } from '@/lib/platform-icons'
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface Clip {
  id: number
  title: string
  description?: string
  hashtags?: string[]
  aspectRatio?: string
  duration?: number
  thumbnailUrl?: string
  videoUrl?: string
}

interface PublishingModalEnhancedProps {
  clip: Clip
  isOpen: boolean
  onClose: () => void
  onPublishComplete: (results: any) => void
}

interface PlatformStatus {
  platform: string
  isConnected: boolean
  isExpired: boolean
  isConfigured: boolean
}

interface PostContent {
  title: string
  description: string
  hashtags: string[]
  scheduledFor?: Date
}

const PLATFORM_CONFIGS = [
  {
    id: 'youtube',
    displayName: 'YouTube',
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    maxHashtags: 15,
    supportsScheduling: true
  },
  {
    id: 'tiktok',
    displayName: 'TikTok',
    maxTitleLength: 100,
    maxDescriptionLength: 2200,
    maxHashtags: 100,
    supportsScheduling: false
  },
  {
    id: 'instagram',
    displayName: 'Instagram',
    maxTitleLength: 125,
    maxDescriptionLength: 2200,
    maxHashtags: 30,
    supportsScheduling: true
  },
  {
    id: 'twitter',
    displayName: 'X (Twitter)',
    maxTitleLength: 0, // No separate title
    maxDescriptionLength: 280,
    maxHashtags: 10,
    supportsScheduling: true
  },
  {
    id: 'linkedin',
    displayName: 'LinkedIn',
    maxTitleLength: 150,
    maxDescriptionLength: 1300,
    maxHashtags: 10,
    supportsScheduling: true
  }
]

export function PublishingModalEnhanced({ clip, isOpen, onClose, onPublishComplete }: PublishingModalEnhancedProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [postContent, setPostContent] = useState<PostContent>({
    title: clip.title,
    description: clip.description || '',
    hashtags: clip.hashtags || []
  })
  const [publishing, setPublishing] = useState(false)
  const [publishingProgress, setPublishingProgress] = useState<Record<string, string>>({})
  const [validationResults, setValidationResults] = useState<Record<string, any>>({})
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchConnectionStatus()
    }
  }, [isOpen])

  useEffect(() => {
    validateContent()
  }, [postContent, selectedPlatforms])

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/auth/connect')
      if (response.ok) {
        const data = await response.json()
        setPlatformStatuses(data.platforms || [])
      }
    } catch (error) {
      console.error('Error fetching connection status:', error)
    }
  }

  const validateContent = () => {
    const results: Record<string, any> = {}
    
    selectedPlatforms.forEach(platformId => {
      const config = PLATFORM_CONFIGS.find(p => p.id === platformId)
      if (!config) return

      const errors: string[] = []
      const warnings: string[] = []

      // Title validation
      if (config.maxTitleLength > 0 && postContent.title.length > config.maxTitleLength) {
        errors.push(`Title too long (${postContent.title.length}/${config.maxTitleLength})`)
      }

      // Description validation
      if (postContent.description.length > config.maxDescriptionLength) {
        errors.push(`Description too long (${postContent.description.length}/${config.maxDescriptionLength})`)
      }

      // Hashtag validation
      if (postContent.hashtags.length > config.maxHashtags) {
        errors.push(`Too many hashtags (${postContent.hashtags.length}/${config.maxHashtags})`)
      }

      // Twitter-specific validation
      if (platformId === 'twitter') {
        const fullText = `${postContent.description} ${postContent.hashtags.map(h => `#${h}`).join(' ')}`
        if (fullText.length > 280) {
          errors.push(`Tweet too long (${fullText.length}/280 characters)`)
        }
      }

      // Scheduling validation
      if (isScheduled && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
        if (scheduledDateTime <= new Date()) {
          errors.push('Scheduled time must be in the future')
        }
        if (!config.supportsScheduling) {
          warnings.push('This platform does not support scheduling')
        }
      }

      results[platformId] = {
        valid: errors.length === 0,
        errors,
        warnings
      }
    })

    setValidationResults(results)
  }

  const handlePlatformToggle = (platformId: string) => {
    const newSelected = new Set(selectedPlatforms)
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId)
    } else {
      newSelected.add(platformId)
    }
    setSelectedPlatforms(newSelected)
  }

  const handlePublish = async () => {
    if (selectedPlatforms.size === 0) {
      alert('Please select at least one platform')
      return
    }

    // Check if all selected platforms are valid
    const hasErrors = Array.from(selectedPlatforms).some(platform => 
      !validationResults[platform]?.valid
    )

    if (hasErrors) {
      alert('Please fix validation errors before publishing')
      return
    }

    setPublishing(true)
    setPublishingProgress({})

    try {
      const publishData = {
        platforms: Array.from(selectedPlatforms),
        post: {
          id: `clip_${clip.id}`,
          platform: '', // Will be set for each platform
          title: postContent.title,
          description: postContent.description,
          videoUrl: clip.videoUrl,
          thumbnailUrl: clip.thumbnailUrl,
          tags: postContent.hashtags,
          scheduledFor: isScheduled && scheduledDate && scheduledTime 
            ? new Date(`${scheduledDate}T${scheduledTime}`)
            : undefined,
          status: 'draft' as const
        },
        accessTokens: {} // This would normally come from the auth system
      }

      // Update progress for each platform
      selectedPlatforms.forEach(platform => {
        setPublishingProgress(prev => ({
          ...prev,
          [platform]: 'publishing'
        }))
      })

      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishData)
      })

      const result = await response.json()

      if (response.ok) {
        // Update progress with results
        Object.entries(result.results || {}).forEach(([platform, platformResult]: [string, any]) => {
          setPublishingProgress(prev => ({
            ...prev,
            [platform]: platformResult.success ? 'success' : 'error'
          }))
        })

        // Call completion callback
        onPublishComplete(result)

        // Close modal after a delay to show results
        setTimeout(() => {
          onClose()
          setPublishing(false)
          setPublishingProgress({})
        }, 3000)
      } else {
        console.error('Publishing failed:', result)
        setPublishing(false)
        alert(`Publishing failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Publishing error:', error)
      setPublishing(false)
      alert('An error occurred while publishing. Please try again.')
    }
  }

  const getProgressIcon = (status: string) => {
    switch (status) {
      case 'publishing':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  if (!isOpen) return null

  const connectedPlatforms = platformStatuses.filter(p => p.isConnected && !p.isExpired)
  const availablePlatforms = PLATFORM_CONFIGS.filter(p => 
    connectedPlatforms.some(cp => cp.platform === p.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Publish Content</h2>
              <p className="text-gray-600 mt-1">Share "{clip.title}" across your connected platforms</p>
            </div>
            <Button variant="ghost" onClick={onClose} disabled={publishing}>
              ×
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Content Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Content Preview</h3>
            <div className="flex gap-4">
              {clip.thumbnailUrl && (
                <img 
                  src={clip.thumbnailUrl} 
                  alt={clip.title}
                  className="w-32 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{clip.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{clip.description}</p>
                {clip.duration && (
                  <p className="text-xs text-gray-500 mt-1">
                    Duration: {Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Select Platforms</h3>
            {availablePlatforms.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No connected platforms available.</p>
                <p className="text-sm text-gray-500 mt-1">Connect your social media accounts first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePlatforms.map((platform) => {
                  const isSelected = selectedPlatforms.has(platform.id)
                  const validation = validationResults[platform.id]
                  const progress = publishingProgress[platform.id]

                  return (
                    <div
                      key={platform.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${publishing ? 'cursor-not-allowed opacity-50' : ''}`}
                      onClick={() => !publishing && handlePlatformToggle(platform.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PlatformIcon platformId={platform.id} size="sm" />
                          <div>
                            <h4 className="font-medium text-gray-900">{platform.displayName}</h4>
                            {validation && isSelected && (
                              <div className="text-xs mt-1">
                                {validation.errors.length > 0 && (
                                  <div className="text-red-600">
                                    {validation.errors.join(', ')}
                                  </div>
                                )}
                                {validation.warnings.length > 0 && (
                                  <div className="text-yellow-600">
                                    {validation.warnings.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {progress && getProgressIcon(progress)}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600"
                            disabled={publishing}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Content Customization */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Customize Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={postContent.title}
                  onChange={(e) => setPostContent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={publishing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={postContent.description}
                  onChange={(e) => setPostContent(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={publishing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hashtags (comma-separated)
                </label>
                <input
                  type="text"
                  value={postContent.hashtags.join(', ')}
                  onChange={(e) => setPostContent(prev => ({ 
                    ...prev, 
                    hashtags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="content, creator, video"
                  disabled={publishing}
                />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-gray-900">Scheduling</h3>
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="w-4 h-4 text-blue-600"
                disabled={publishing}
              />
              <span className="text-sm text-gray-600">Schedule for later</span>
            </div>

            {isScheduled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={publishing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={publishing}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedPlatforms.size > 0 
                ? `Publishing to ${selectedPlatforms.size} platform${selectedPlatforms.size > 1 ? 's' : ''}`
                : 'Select platforms to continue'
              }
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={publishing}>
                Cancel
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={publishing || selectedPlatforms.size === 0 || availablePlatforms.length === 0}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                {publishing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Publishing...
                  </>
                ) : (
                  isScheduled ? 'Schedule Posts' : 'Publish Now'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
