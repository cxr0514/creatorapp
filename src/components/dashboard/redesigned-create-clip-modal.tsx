'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Scissors, 
  Plus, 
  Trash2,
  Clock,
  X,
  Sparkles,
  Video,
  FileText,
  Eye,
  Download,
  Upload,
  Zap
} from 'lucide-react'
import { Range, getTrackBackground } from 'react-range'
import { api } from '@/trpc/react'

interface Video {
  id: number
  title: string
  storageUrl: string
  duration: number
  thumbnailUrl?: string
}

interface ClipData {
  id: string
  title: string
  description: string
  startTime: number
  endTime: number
  aspectRatio: string
  platform: string
  thumbnailUrl?: string
}

interface RedesignedCreateClipModalProps {
  isOpen: boolean
  onClose: () => void
  video?: Video
  onClipsCreated?: () => void
}

// Enhanced platform aspect ratio mappings with more detail
const PLATFORM_PRESETS = {
  'tiktok': { 
    value: '9:16', 
    label: 'TikTok', 
    icon: '🎵',
    color: 'bg-black text-white',
    description: 'Vertical mobile content, trending music'
  },
  'instagram-reels': { 
    value: '9:16', 
    label: 'Instagram Reels', 
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
    description: 'Short-form vertical content'
  },
  'youtube-shorts': { 
    value: '9:16', 
    label: 'YouTube Shorts', 
    icon: '▶️',
    color: 'bg-red-600 text-white',
    description: 'Mobile-first vertical videos'
  },
  'instagram-feed': { 
    value: '1:1', 
    label: 'Instagram Feed', 
    icon: '📸',
    color: 'bg-gradient-to-br from-orange-500 to-pink-500 text-white',
    description: 'Square feed posts'
  },
  'youtube': { 
    value: '16:9', 
    label: 'YouTube', 
    icon: '📺',
    color: 'bg-red-600 text-white',
    description: 'Traditional video content'
  },
  'linkedin': { 
    value: '16:9', 
    label: 'LinkedIn', 
    icon: '💼',
    color: 'bg-blue-700 text-white',
    description: 'Professional content'
  },
  'twitter': { 
    value: '16:9', 
    label: 'X (Twitter)', 
    icon: '🐦',
    color: 'bg-black text-white',
    description: 'Social media clips'
  },
  'facebook': { 
    value: '1:1', 
    label: 'Facebook', 
    icon: '👥',
    color: 'bg-blue-600 text-white',
    description: 'Social engagement content'
  },
  'custom': { 
    value: '16:9', 
    label: 'Custom', 
    icon: '⚙️',
    color: 'bg-gray-600 text-white',
    description: 'Custom aspect ratio'
  }
}

export function RedesignedCreateClipModal({ 
  isOpen, 
  onClose, 
  video, 
  onClipsCreated 
}: RedesignedCreateClipModalProps) {
  // tRPC AI mutation for clip copy
  const aiMutation = api.ai.generateClipCopy.useMutation()
  // Core state
  const [availableVideos, setAvailableVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(video || null)
  const [loadingVideos, setLoadingVideos] = useState(false)

  // Clip creation state with enhanced features
  const [clips, setClips] = useState<ClipData[]>([])
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [globalDescription, setGlobalDescription] = useState('')
  const [isGeneratingAIDescription, setIsGeneratingAIDescription] = useState(false)
  const [aiDescriptionSuggested, setAiDescriptionSuggested] = useState(false)

  // Enhanced video player state
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null)

  // Enhanced timeline with react-range
  const [timelineValues, setTimelineValues] = useState<number[]>([0, 30])


  // UI state
  const [isCreating, setIsCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('setup')


  // Auto-save and persistence
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)

  // Initialize
  useEffect(() => {
    if (isOpen && !video) {
      fetchAvailableVideos()
    }
  }, [isOpen, video])

  useEffect(() => {
    setSelectedVideo(video || null)
    setVideoLoadError(null) // Clear any previous video errors
  }, [video])

  // Initialize with one clip
  useEffect(() => {
    if (selectedVideo && clips.length === 0) {
      const initialClip: ClipData = {
        id: `clip-${Date.now()}`,
        title: `${selectedVideo.title} - Clip 1`,
        description: '',
        startTime: 0,
        endTime: Math.min(30, selectedVideo.duration),
        aspectRatio: '9:16',
        platform: 'tiktok'
      }
      setClips([initialClip])
      setSelectedClipId(initialClip.id)
      setTimelineValues([0, Math.min(30, selectedVideo.duration)])
    }
  }, [selectedVideo, clips.length])

  const fetchAvailableVideos = async () => {
    setLoadingVideos(true)
    try {
      const response = await fetch('/api/videos')
      if (response.ok) {
        const videos = await response.json()
        setAvailableVideos(videos)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoadingVideos(false)
    }
  }

  // AI Description Generation
  const generateAIDescription = async () => {
    if (!selectedVideo) return
    setIsGeneratingAIDescription(true)
    setValidationErrors([])
    try {
      const result = await aiMutation.mutateAsync({ 
        videoContext: selectedVideo.title || selectedVideo.storageUrl,
        targetAudience: "General audience", 
        platform: "general",
        tone: "casual",
        clipCount: 1
      })
      const aiDesc = result?.data?.descriptions?.[0] || ''
      setGlobalDescription(aiDesc)
      setAiDescriptionSuggested(true)
      setClips(prev => prev.map(clip => ({ ...clip, description: clip.description || aiDesc })))
    } catch (error) {
      console.error('AI generation failed', error)
      const msg = error instanceof Error ? error.message : 'Unknown AI error'
      setValidationErrors([`AI service error: ${msg}`])
    }
    setIsGeneratingAIDescription(false)
  }

  // Video player controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0
      setDuration(dur)
      // initialize trim range and clip durations ensuring at least 1s
      const defaultEnd = dur > 1 ? dur : 1
      setTimelineValues([0, defaultEnd])
      // update first clip times as well
      setClips(prev => prev.map((clip, idx) => idx === 0 ? { ...clip, startTime: 0, endTime: defaultEnd } : clip))
      console.log('Video metadata loaded:', dur)
    }
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVideoError = (error: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = error.currentTarget
    const videoError = videoElement.error
    
    console.error('Video loading error - detailed debugging:', {
      errorEvent: error,
      videoError: videoError,
      errorCode: videoError?.code || 'unknown',
      errorMessage: videoError?.message || 'No error message',
      src: videoElement.src,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState,
      selectedVideo: selectedVideo,
      videoUrl: selectedVideo?.storageUrl || 'No URL found'
    })
    
    // Set a user-friendly error state with more specific error information
    const errorMessage = videoError?.message || 
                         (videoError?.code ? `Error code: ${videoError.code}` : 'Unknown video error')
    setVideoLoadError(`Failed to load video: ${errorMessage}`)
  }

  const handleVideoLoadStart = () => {
    console.log('Video load started for:', selectedVideo?.storageUrl)
  }

  const handleVideoCanPlay = () => {
    console.log('Video can play:', {
      duration: videoRef.current?.duration,
      readyState: videoRef.current?.readyState
    })
  }

  // Test video loading functionality
  const testVideoLoading = async () => {
    if (!selectedVideo) {
      console.log('No video selected for testing')
      return
    }
    
    console.log('Testing video loading:', selectedVideo.storageUrl)
    
    try {
      // Test if URL is accessible with proper error handling
      const response = await fetch(selectedVideo.storageUrl, { 
        method: 'HEAD',
        mode: 'cors'
      })
      
      if (response.ok) {
        console.log('Video URL test successful:', {
          status: response.status,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        })
      } else {
        console.warn('Video URL test failed:', {
          status: response.status,
          statusText: response.statusText
        })
      }
    } catch (error) {
      console.error('Video URL test failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        url: selectedVideo.storageUrl
      })
      
      // Don't throw the error, just log it
      console.log('This might be due to CORS restrictions or network issues')
    }
    
    // Force video to reload
    if (videoRef.current) {
      console.log('Reloading video element')
      videoRef.current.load()
    }
  }

  // Timeline handling with react-range
  const handleTimelineChange = (values: number[]) => {
    setTimelineValues(values)
    if (selectedClipId) {
      updateClip(selectedClipId, { 
        startTime: values[0], 
        endTime: values[1] 
      })
    }
    setIsDirty(true)
  }

  // Clip management
  const addNewClip = () => {
    const newClip: ClipData = {
      id: `clip-${Date.now()}`,
      title: `${selectedVideo?.title} - Clip ${clips.length + 1}`,
      description: globalDescription,
      startTime: timelineValues[0] || 0,
      endTime: timelineValues[1] || 30,
      aspectRatio: '9:16',
      platform: 'tiktok'
    }
    setClips(prev => [...prev, newClip])
    setSelectedClipId(newClip.id)
    setIsDirty(true)
  }

  const updateClip = (clipId: string, updates: Partial<ClipData>) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    ))
    setIsDirty(true)
  }

  const deleteClip = (clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId))
    if (selectedClipId === clipId) {
      const remainingClips = clips.filter(clip => clip.id !== clipId)
      setSelectedClipId(remainingClips.length > 0 ? remainingClips[0].id : null)
    }
    setIsDirty(true)
  }

  const duplicateClip = (clipId: string) => {
    const clipToDuplicate = clips.find(clip => clip.id === clipId)
    if (clipToDuplicate) {
      const newClip: ClipData = {
        ...clipToDuplicate,
        id: `clip-${Date.now()}`,
        title: `${clipToDuplicate.title} (Copy)`
      }
      setClips(prev => [...prev, newClip])
      setSelectedClipId(newClip.id)
      setIsDirty(true)
    }
  }

  // Quick clip generation from current timeline selection
  const createClipFromSelection = () => {
    if (!selectedVideo) return
    
    const newClip: ClipData = {
      id: `clip-${Date.now()}`,
      title: `${selectedVideo.title} - ${formatTime(timelineValues[0])}`,
      description: globalDescription,
      startTime: timelineValues[0],
      endTime: timelineValues[1],
      aspectRatio: '9:16',
      platform: 'tiktok'
    }
    setClips(prev => [...prev, newClip])
    setSelectedClipId(newClip.id)
    setIsDirty(true)
  }

  // Auto-generate multiple clips
  const autoGenerateClips = (count: number) => {
    if (!selectedVideo) return

    const segmentLength = duration / count
    const newClips: ClipData[] = []

    for (let i = 0; i < count; i++) {
      const startTime = i * segmentLength
      const endTime = Math.min((i + 1) * segmentLength, duration)
      
      newClips.push({
        id: `clip-${Date.now()}-${i}`,
        title: `${selectedVideo.title} - Part ${i + 1}`,
        description: globalDescription,
        startTime,
        endTime,
        aspectRatio: '9:16',
        platform: 'tiktok'
      })
    }

    setClips(newClips)
    setSelectedClipId(newClips[0]?.id || null)
    setIsDirty(true)
  }

  // Platform preset selection
  const applyPlatformPreset = (clipId: string, platformKey: string) => {
    const preset = PLATFORM_PRESETS[platformKey as keyof typeof PLATFORM_PRESETS]
    if (preset) {
      updateClip(clipId, { 
        platform: platformKey,
        aspectRatio: preset.value 
      })
    }
  }

  // Validation
  const validateClips = (): boolean => {
    const errors: string[] = []
    
    if (clips.length === 0) {
      errors.push('Create at least one clip')
    }

    clips.forEach((clip, index) => {
      if (!clip.title.trim()) {
        errors.push(`Clip ${index + 1} needs a title`)
      }
      if (clip.endTime <= clip.startTime) {
        errors.push(`Clip ${index + 1} end time must be after start time`)
      }
      if (clip.endTime - clip.startTime < 1) {
        errors.push(`Clip ${index + 1} must be at least 1 second long`)
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Create clips with enhanced progress tracking
  const handleCreateClips = async () => {
    if (!validateClips() || !selectedVideo) return
    
    setIsCreating(true)
    setCreationProgress(0)
    setActiveTab('progress')

    try {
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        
        const formData = new FormData()
        formData.append('videoId', selectedVideo.id.toString())
        formData.append('title', clip.title)
        formData.append('description', clip.description || '')
        formData.append('startTime', clip.startTime.toString())
        formData.append('endTime', clip.endTime.toString())
        formData.append('aspectRatio', clip.aspectRatio)

        const response = await fetch('/api/clips', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to create clip: ${clip.title}`)
        }

        setCreationProgress(((i + 1) / clips.length) * 100)
      }

      // Clear saved data and trigger refresh
      if (selectedVideo) {
        localStorage.removeItem(`clipEditor_${selectedVideo.id}`)
      }
      
      onClipsCreated?.()
      onClose()
    } catch (error) {
      console.error('Error creating clips:', error)
      setValidationErrors([error instanceof Error ? error.message : 'Failed to create clips'])
    } finally {
      setIsCreating(false)
      setCreationProgress(0)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (!selectedVideo || !isDirty) return
    
    const saveToStorage = () => {
      const storageKey = `clipEditor_${selectedVideo.id}`
      const dataToSave = {
        clips,
        globalDescription,
        lastModified: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
      setLastSaveTime(new Date())
      setIsDirty(false)
    }

    const timerId = setTimeout(saveToStorage, 2000)
    return () => clearTimeout(timerId)
  }, [clips, globalDescription, selectedVideo, isDirty])

  // Load saved data
  useEffect(() => {
    if (!selectedVideo) return
    
    const storageKey = `clipEditor_${selectedVideo.id}`
    const savedData = localStorage.getItem(storageKey)
    if (savedData) {
      try {
        const { clips: savedClips, globalDescription: savedDesc, lastModified } = JSON.parse(savedData)
        const hoursSinceModified = (new Date().getTime() - new Date(lastModified).getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceModified < 24) {
          setClips(savedClips)
          setGlobalDescription(savedDesc || '')
          setSelectedClipId(savedClips[0]?.id || null)
          setLastSaveTime(new Date(lastModified))
        } else {
          localStorage.removeItem(storageKey)
        }
      } catch (error) {
        console.error('Error loading saved clips:', error)
      }
    }
  }, [selectedVideo])

  // Update timeline when clip selection changes
  useEffect(() => {
    const selectedClip = clips.find(clip => clip.id === selectedClipId)
    if (selectedClip) {
      setTimelineValues([selectedClip.startTime, selectedClip.endTime])
    }
  }, [selectedClipId, clips])

  // Utility functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const selectedClip = clips.find(clip => clip.id === selectedClipId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedVideo ? `Create Clips: ${selectedVideo.title}` : 'Create Clips'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {clips.length} clip{clips.length !== 1 ? 's' : ''} configured
                  {lastSaveTime && (
                    <span className="ml-2">• Saved {lastSaveTime.toLocaleTimeString()}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDirty && (
                <Badge variant="outline" className="text-xs">
                  Unsaved changes
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Error Display */}
        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mx-6">
            <h4 className="text-sm font-medium text-destructive mb-1">Please fix these issues:</h4>
            <ul className="list-disc list-inside text-sm text-destructive">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Video Load Error Display */}
        {videoLoadError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mx-6">
            <h4 className="text-sm font-medium text-destructive mb-1">Video Loading Error:</h4>
            <p className="text-sm text-destructive">{videoLoadError}</p>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6 grid w-full grid-cols-4">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="clips">Clips ({clips.length})</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="progress" disabled={!isCreating}>
                {isCreating ? 'Creating...' : 'Progress'}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <TabsContent value="setup" className="mt-4 space-y-6">
                {/* Video Selection */}
                {!selectedVideo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Select Video
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingVideos ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="ml-2">Loading videos...</span>
                        </div>
                      ) : (
                        <Select
                          value={''}
                          onValueChange={(value) => {
                            const video = availableVideos.find(v => v.id.toString() === value)
                            setSelectedVideo(video || null)
                            setVideoLoadError(null) // Clear any previous video errors
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a video to create clips from..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVideos.map((video) => (
                              <SelectItem key={video.id} value={video.id.toString()}>
                                <div className="flex items-center gap-3">
                                  {video.thumbnailUrl && (
                                    <Image 
                                      src={video.thumbnailUrl} 
                                      alt={video.title}
                                      width={40}
                                      height={30}
                                      className="w-10 h-7 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{video.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatTime(video.duration)}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </CardContent>
                  </Card>
                )}

                {selectedVideo && (
                  <>
                    {/* Global Description with AI */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Description Template
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateAIDescription}
                            disabled={isGeneratingAIDescription}
                            className="flex items-center gap-2"
                          >
                            {isGeneratingAIDescription ? (
                              <>
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                AI Generate
                              </>
                            )}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={globalDescription}
                          onChange={(e) => {
                            setGlobalDescription(e.target.value)
                            setIsDirty(true)
                          }}
                          placeholder="Enter a description template that will be applied to all clips..."
                          rows={3}
                          className={aiDescriptionSuggested ? 'bg-primary/5 border-primary/30' : ''}
                        />
                        {aiDescriptionSuggested && (
                          <p className="text-xs text-primary mt-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI-generated description
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          This description will be used as a template for all clips. You can customize individual clip descriptions later.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Quick Generation */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Quick Generation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[2, 3, 5, 10].map(count => (
                            <Button
                              key={count}
                              variant="outline"
                              onClick={() => autoGenerateClips(count)}
                              className="flex items-center gap-2"
                            >
                              <span>{count}</span>
                              <span className="text-xs">clips</span>
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Automatically divide your video into equal segments
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="clips" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Video Player & Timeline */}
                  <div className="space-y-4">
                    {selectedVideo && (
                      <>
                        {/* Enhanced Video Player */}
                        <Card>
                          <CardContent className="p-4">
                            <div className="relative bg-black rounded-lg overflow-hidden">
                              <video
                                ref={videoRef}
                                src={selectedVideo.storageUrl}
                                className="w-full h-48 object-contain"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                                onError={handleVideoError}
                                onLoadStart={handleVideoLoadStart}
                                onCanPlay={handleVideoCanPlay}
                                crossOrigin="anonymous"
                                preload="metadata"
                                muted={isMuted}
                              />
                              
                              {/* Enhanced Controls */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                <div className="flex items-center justify-between text-white text-sm">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={togglePlay}
                                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                                    >
                                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={toggleMute}
                                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                                    >
                                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                    </Button>

                                    <Select value={playbackRate.toString()} onValueChange={(value) => changePlaybackRate(parseFloat(value))}>
                                      <SelectTrigger className="w-16 h-6 text-xs bg-black/50 border-white/20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="0.5">0.5x</SelectItem>
                                        <SelectItem value="1">1x</SelectItem>
                                        <SelectItem value="1.25">1.25x</SelectItem>
                                        <SelectItem value="1.5">1.5x</SelectItem>
                                        <SelectItem value="2">2x</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Enhanced Timeline with react-range */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between text-sm">
                              <span>Timeline Selection</span>
                              <div className="flex items-center gap-2">
                                {duration === 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={testVideoLoading}
                                    className="flex items-center gap-1 h-7 text-xs"
                                  >
                                    🔧 Debug Video
                                  </Button>
                                )}
                                {selectedClip && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={createClipFromSelection}
                                    className="flex items-center gap-1 h-7"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Clip
                                  </Button>
                                )}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {duration > 0 ? (
                                <>
                                  <Range
                                    values={timelineValues}
                                    step={0.1}
                                    min={0}
                                    max={duration}
                                    onChange={handleTimelineChange}
                                    renderTrack={({ props, children }) => (
                                      <div
                                        onMouseDown={props.onMouseDown}
                                        onTouchStart={props.onTouchStart}
                                        className="h-6 flex w-full"
                                        style={props.style}
                                      >
                                        <div
                                          ref={props.ref}
                                          className="h-2 w-full bg-muted rounded-md self-center"
                                          style={{
                                            background: getTrackBackground({
                                              values: timelineValues,
                                              colors: ['#e2e8f0', '#3b82f6', '#e2e8f0'],
                                              min: 0,
                                              max: duration,
                                            }),
                                          }}
                                        >
                                          {children}
                                        </div>
                                      </div>
                                    )}
                                    renderThumb={({ props, isDragged }) => {
                                      const { key, ...restProps } = props;
                                      return (
                                        <div
                                          key={key}
                                          {...restProps}
                                          className={`h-4 w-4 bg-primary border-2 border-white rounded-full shadow-md outline-none ${
                                            isDragged ? 'scale-110' : ''
                                          }`}
                                          style={props.style}
                                        />
                                      );
                                    }}
                                  />
                                  
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-4">
                                      <span>Selection: {formatTime(timelineValues[0])} - {formatTime(timelineValues[1])}</span>
                                      <span className="text-primary font-medium">
                                        Duration: {formatTime(timelineValues[1] - timelineValues[0])}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => seekTo(timelineValues[0])}
                                      className="h-7"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Preview
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <p>Loading video timeline...</p>
                                  <p className="text-sm mt-1">Please wait for the video to load</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Clip List & Configuration */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-sm">
                          <span>Clips ({clips.length})</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addNewClip}
                            disabled={!selectedVideo}
                            className="flex items-center gap-1 h-7"
                          >
                            <Plus className="w-3 h-3" />
                            Add Clip
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                        {clips.map((clip) => (
                          <div
                            key={clip.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedClipId === clip.id 
                                ? 'border-primary/50 bg-primary/5' 
                                : 'border-border hover:border-border/80'
                            }`}
                            onClick={() => setSelectedClipId(clip.id)}
                          >
                            <div className="space-y-3">
                              {/* Title */}
                              <Input
                                value={clip.title}
                                onChange={(e) => updateClip(clip.id, { title: e.target.value })}
                                className="text-sm font-medium"
                                placeholder="Clip title..."
                                onClick={(e) => e.stopPropagation()}
                              />

                              {/* Platform Selection */}
                              <div className="grid grid-cols-3 gap-1">
                                {Object.entries(PLATFORM_PRESETS).slice(0, 6).map(([key, preset]) => (
                                  <button
                                    key={key}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      applyPlatformPreset(clip.id, key)
                                    }}
                                    className={`p-2 rounded text-xs font-medium transition-all ${
                                      clip.platform === key 
                                        ? preset.color
                                        : 'bg-muted hover:bg-muted/80'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span>{preset.icon}</span>
                                      <span className="truncate">{preset.label}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>

                              {/* Time Controls */}
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Start Time</Label>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        value={clip.startTime.toFixed(1)}
                                        onChange={(e) => {
                                          const startTime = Math.max(0, parseFloat(e.target.value) || 0);
                                          if (startTime < clip.endTime) {
                                            updateClip(clip.id, { startTime });
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs h-7"
                                        step="0.1"
                                        min="0"
                                        max={duration || 60}
                                      />
                                      <span className="text-xs text-muted-foreground">s</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">End Time</Label>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        value={clip.endTime.toFixed(1)}
                                        onChange={(e) => {
                                          const endTime = Math.min(duration || 60, parseFloat(e.target.value) || 1);
                                          if (endTime > clip.startTime) {
                                            updateClip(clip.id, { endTime });
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs h-7"
                                        step="0.1"
                                        min="0.1"
                                        max={duration || 60}
                                      />
                                      <span className="text-xs text-muted-foreground">s</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Duration Display & Quick Actions */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>Duration: {formatTime(clip.endTime - clip.startTime)}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTimelineValues([clip.startTime, clip.endTime]);
                                        seekTo(clip.startTime);
                                      }}
                                      className="h-5 px-2 text-xs"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Preview
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        duplicateClip(clip.id)
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteClip(clip.id)
                                      }}
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Description (if expanded) */}
                              {selectedClipId === clip.id && (
                                <div className="space-y-2 border-t pt-3">
                                  <Label className="text-xs">Description</Label>
                                  <Textarea
                                    value={clip.description}
                                    onChange={(e) => updateClip(clip.id, { description: e.target.value })}
                                    placeholder="Clip description..."
                                    rows={2}
                                    className="text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clips.map((clip) => (
                    <Card key={clip.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {selectedVideo && (
                          <div className="relative bg-black aspect-video">
                            <video                                src={selectedVideo.storageUrl}
                              className="w-full h-full object-contain"
                              controls
                              preload="metadata"
                              onLoadedMetadata={(e) => {
                                // Set the video to start at clip start time
                                const videoElement = e.currentTarget;
                                videoElement.currentTime = clip.startTime;
                              }}
                              onTimeUpdate={(e) => {
                                // Stop playback at clip end time
                                const videoElement = e.currentTarget;
                                if (videoElement.currentTime >= clip.endTime) {
                                  videoElement.pause();
                                  videoElement.currentTime = clip.startTime;
                                }
                              }}
                            />
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                            </div>
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {formatTime(clip.endTime - clip.startTime)}
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          <h3 className="font-medium text-sm mb-1">{clip.title}</h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{clip.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {PLATFORM_PRESETS[clip.platform as keyof typeof PLATFORM_PRESETS]?.label || clip.platform}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{clip.aspectRatio}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Creation Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={creationProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      {isCreating 
                        ? `Creating clips... ${Math.round(creationProgress)}% complete`
                        : 'Ready to create clips'
                      }
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Footer Actions */}
            <div className="border-t p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose} disabled={isCreating}>
                  Cancel
                </Button>
                {isDirty && (
                  <span className="text-xs text-muted-foreground">
                    Changes saved automatically
                  </span>
                )}
              </div>
              <Button
                onClick={handleCreateClips}
                disabled={isCreating || clips.length === 0 || !selectedVideo}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating {clips.length} Clip{clips.length !== 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Create {clips.length} Clip{clips.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
