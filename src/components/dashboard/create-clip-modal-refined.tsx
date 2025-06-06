// filepath: /Users/CXR0514/Library/CloudStorage/OneDrive-TheHomeDepot/Documents 1/creators/creatorapp/src/components/dashboard/create-clip-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import VideoJSPlayer from './video-js-player'
import { Wand2, Sparkles } from 'lucide-react'

interface Video {
  id: number
  title: string
  duration: number
  url?: string
  storageKey?: string
}

interface CreateClipModalProps {
  isOpen: boolean
  onClose: () => void
  videoId?: number
  onClipCreated?: () => void
}

// Platform aspect ratio mappings
const PLATFORM_ASPECT_RATIOS = {
  'tiktok': { value: '9:16', label: 'TikTok/Reels/Shorts (9:16)', platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'] },
  'instagram': { value: '1:1', label: 'Instagram Feed (1:1)', platforms: ['Instagram Feed'] },
  'twitter': { value: '16:9', label: 'X/Twitter (16:9)', platforms: ['X/Twitter', 'LinkedIn'] },
  'youtube': { value: '16:9', label: 'YouTube (16:9)', platforms: ['YouTube'] },
  'custom': { value: '16:9', label: 'Custom', platforms: [] }
}

export function CreateClipModal({ isOpen, onClose, videoId, onClipCreated }: CreateClipModalProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<number | undefined>(videoId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(30)
  const [platform, setPlatform] = useState<keyof typeof PLATFORM_ASPECT_RATIOS>('tiktok')
  const [clipCount, setClipCount] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiSuggested, setAiSuggested] = useState(false)
  
  // Video player state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentTime, setCurrentTime] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [videoDuration, setVideoDuration] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchVideos()
      if (videoId) {
        setSelectedVideoId(videoId)
      }
    }
  }, [isOpen, videoId])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos')
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  }

  const selectedVideo = videos.find(v => v.id === selectedVideoId)

  const generateAIClipCopy = async () => {
    if (!selectedVideo) return

    setIsGeneratingAI(true)
    try {
      const response = await fetch('/api/ai/clip-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoTitle: selectedVideo.title,
          clipCount,
          platform,
          action: 'generate'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.descriptions && data.descriptions.length > 0) {
          setDescription(data.descriptions[0])
          setAiSuggested(true)
        }
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to generate AI clip copy')
      }
    } catch (error) {
      console.error('Error generating AI clip copy:', error)
      alert('Failed to generate AI clip copy')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const improveDescription = async () => {
    if (!selectedVideo || !description) return

    setIsGeneratingAI(true)
    try {
      const response = await fetch('/api/ai/clip-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoTitle: selectedVideo.title,
          platform,
          existingDescription: description,
          action: 'improve'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.descriptions && data.descriptions.length > 0) {
          setDescription(data.descriptions[0])
          setAiSuggested(true)
        }
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to improve description')
      }
    } catch (error) {
      console.error('Error improving description:', error)
      alert('Failed to improve description')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (timeString: string): number => {
    const parts = timeString.split(':')
    const minutes = parseInt(parts[0] || '0', 10)
    const seconds = parseInt(parts[1] || '0', 10)
    return minutes * 60 + seconds
  }

  const handleTimelineChange = (values: number[]) => {
    setStartTime(values[0])
    setEndTime(values[1])
  }

  const handleCreateClips = async () => {
    if (!selectedVideoId || !title.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (startTime >= endTime) {
      alert('End time must be after start time')
      return
    }

    if (selectedVideo && endTime > selectedVideo.duration) {
      alert('End time cannot exceed video duration')
      return
    }

    setIsCreating(true)

    try {
      // Create multiple clips if clipCount > 1
      const promises = []
      
      for (let i = 0; i < clipCount; i++) {
        const clipTitle = clipCount === 1 ? title : `${title} - Part ${i + 1}`
        
        promises.push(
          fetch('/api/clips', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoId: selectedVideoId,
              title: clipTitle.trim(),
              description: description.trim() || null,
              hashtags,
              tags,
              startTime,
              endTime,
              aspectRatio: PLATFORM_ASPECT_RATIOS[platform].value,
              clipCount: 1, // Create individual clips
            }),
          })
        )
      }

      const responses = await Promise.all(promises)
      const failedCreations = responses.filter(r => !r.ok)
      
      if (failedCreations.length === 0) {
        onClipCreated?.()
        handleClose()
      } else {
        const successfulCreations = responses.length - failedCreations.length
        if (successfulCreations > 0) {
          alert(`Created ${successfulCreations} out of ${clipCount} clips successfully`)
          onClipCreated?.()
          handleClose()
        } else {
          alert('Failed to create clips')
        }
      }
    } catch (error) {
      console.error('Error creating clips:', error)
      alert('Failed to create clips')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setHashtags([])
    setTags([])
    setStartTime(0)
    setEndTime(30)
    setPlatform('tiktok')
    setClipCount(1)
    setSelectedVideoId(undefined)
    setAiSuggested(false)
    setIsPlaying(false)
    setCurrentTime(0)
    onClose()
  }

  const getVideoUrl = (video: Video) => {
    if (video.url) return video.url
    if (video.storageKey) {
      // Construct B2 URL if needed
      return `/api/videos/${video.id}/stream`
    }
    return ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-surface/20 rounded-lg p-2">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Clip</h2>
                <p className="text-primary-foreground/80 text-sm">Transform your video into engaging clips</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-surface/20 rounded-lg p-2 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Video Selection */}
              <div>
                <Label className="text-sm font-semibold text-foreground mb-2">
                  Select Video *
                </Label>
                <Select 
                  value={selectedVideoId?.toString() || ''} 
                  onValueChange={(value) => setSelectedVideoId(value ? parseInt(value, 10) : undefined)}
                  disabled={!!videoId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a video to create clips from" />
                  </SelectTrigger>
                  <SelectContent>
                    {videos.map((video) => (
                      <SelectItem key={video.id} value={video.id.toString()}>
                        {video.title} ({formatTime(video.duration)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clip Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Clip Title *
                  </Label>
                </div>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={aiSuggested ? 'bg-primary/10 border-primary' : ''}
                  placeholder="Enter an engaging title for your clip"
                />
                {aiSuggested && title && (
                  <p className="text-xs text-primary mt-2 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-enhanced title
                  </p>
                )}
              </div>

              {/* Description with AI Helper */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Description
                  </Label>
                  <div className="flex gap-2">
                    {selectedVideo && !description && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAIClipCopy}
                        disabled={isGeneratingAI}
                        className="text-xs border-primary/50 text-primary hover:bg-primary/10"
                      >
                        {isGeneratingAI ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3 mr-1" />
                            AI Generate
                          </>
                        )}
                      </Button>
                    )}
                    {selectedVideo && description && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={improveDescription}
                        disabled={isGeneratingAI}
                        className="text-xs border-primary/50 text-primary hover:bg-primary/10"
                      >
                        {isGeneratingAI ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Improving...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Improve
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={aiSuggested && description ? 'bg-primary/10 border-primary' : ''}
                  placeholder="Describe your clip to help with discovery (optional)"
                />
                {aiSuggested && description && (
                  <p className="text-xs text-primary mt-2 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-generated description
                  </p>
                )}
              </div>

              {/* Platform & Clip Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground mb-2">
                    Platform/Aspect Ratio
                  </Label>
                  <Select value={platform} onValueChange={(value: keyof typeof PLATFORM_ASPECT_RATIOS) => setPlatform(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORM_ASPECT_RATIOS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {PLATFORM_ASPECT_RATIOS[platform].platforms.join(', ')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground mb-2">
                    Number of Clips
                  </Label>
                  <Select value={clipCount.toString()} onValueChange={(value) => setClipCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} clip{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground mb-2">
                    Start Time
                  </Label>
                  <Input
                    type="text"
                    value={formatTime(startTime)}
                    onChange={(e) => setStartTime(parseTimeInput(e.target.value))}
                    placeholder="0:00"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground mb-2">
                    End Time
                  </Label>
                  <Input
                    type="text"
                    value={formatTime(endTime)}
                    onChange={(e) => setEndTime(parseTimeInput(e.target.value))}
                    placeholder="0:30"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Video Preview */}
            <div className="space-y-4">
              {selectedVideo ? (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground">
                    Video Preview
                  </Label>
                  <div className="bg-black rounded-lg overflow-hidden aspect-video">
                    <VideoJSPlayer
                      src={getVideoUrl(selectedVideo)}
                      onTimeUpdate={setCurrentTime}
                      onLoadedMetadata={setVideoDuration}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      className="w-full h-full"
                    />
                  </div>
                  
                  {/* Timeline Trimmer */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">
                      Timeline Selection
                    </Label>
                    <div className="px-3">
                      <Slider
                        value={[startTime, endTime]}
                        onValueChange={handleTimelineChange}
                        max={selectedVideo.duration}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0:00</span>
                        <span>{formatTime(selectedVideo.duration)}</span>
                      </div>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">Selection:</span>
                          <span className="ml-2">{formatTime(startTime)} - {formatTime(endTime)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <span className="ml-2 text-primary font-semibold">{formatTime(Math.max(0, endTime - startTime))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <svg className="h-12 w-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-muted-foreground">Select a video to see preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-border">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateClips} 
              disabled={isCreating || !selectedVideoId || !title.trim()}
              className="bg-gradient-to-r from-primary to-primary/90"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating {clipCount > 1 ? `${clipCount} Clips` : 'Clip'}...
                </>
              ) : (
                <>Create {clipCount > 1 ? `${clipCount} Clips` : 'Clip'}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
