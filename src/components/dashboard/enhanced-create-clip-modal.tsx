'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Scissors, 
  Plus, 
  Trash2,
  Clock,
  Wand2,
  X
} from 'lucide-react'
import ClipTrimmer from '@/components/video/ClipTrimmer'
import AISuggestionList from '@/components/suggestions/AISuggestionList'
import type { RepurposingSuggestion } from '@/types/suggestions'

interface Video {
  id: number
  title: string
  url: string
  duration: number
  thumbnailUrl?: string
}

interface ClipData {
  id: string
  title: string
  startTime: number
  endTime: number
  aspectRatio: string
  thumbnailUrl?: string
}

interface EnhancedCreateClipModalProps {
  isOpen: boolean
  onClose: () => void
  video?: Video
  onClipsCreated?: () => void
}

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)', platforms: ['YouTube', 'LinkedIn'] },
  { value: '9:16', label: '9:16 (Portrait)', platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'] },
  { value: '1:1', label: '1:1 (Square)', platforms: ['Instagram Post', 'Twitter'] },
  { value: '4:3', label: '4:3 (Classic)', platforms: ['Facebook'] }
]

export function EnhancedCreateClipModal({ 
  isOpen, 
  onClose, 
  video, 
  onClipsCreated 
}: EnhancedCreateClipModalProps) {
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  // Video selection state (when no video is provided)
  const [availableVideos, setAvailableVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(video || null)
  const [loadingVideos, setLoadingVideos] = useState(false)

  // Clip creation state
  const [numberOfClips, setNumberOfClips] = useState(1)
  const [clips, setClips] = useState<ClipData[]>([])
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)
  const [trimmingClip, setTrimmingClip] = useState<ClipData | null>(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  // Timeline state
  const [selectionStart, setSelectionStart] = useState<number | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null)

  // Auto-save state
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Fetch available videos when modal opens and no video is provided
  useEffect(() => {
    if (isOpen && !video) {
      fetchAvailableVideos()
    }
  }, [isOpen, video])

  // Update selected video when prop changes
  useEffect(() => {
    setSelectedVideo(video || null)
  }, [video])

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

  // Initialize clips when number changes
  useEffect(() => {
    const currentDuration = selectedVideo?.duration || duration || 30
    if (numberOfClips > clips.length) {
      const newClips: ClipData[] = []
      for (let i = clips.length; i < numberOfClips; i++) {
        newClips.push({
          id: `clip-${Date.now()}-${i}`,
          title: `Clip ${i + 1}`,
          startTime: 0,
          endTime: Math.min(30, currentDuration),
          aspectRatio: '16:9'
        })
      }
      setClips(prev => [...prev, ...newClips])
    } else if (numberOfClips < clips.length) {
      setClips(prev => prev.slice(0, numberOfClips))
    }
  }, [numberOfClips, clips.length, duration, selectedVideo?.duration])

  // Video player handlers
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // Timeline handlers
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * duration
    
    if (selectionStart === null) {
      setSelectionStart(time)
      setSelectionEnd(null)
    } else if (selectionEnd === null) {
      if (time > selectionStart) {
        setSelectionEnd(time)
      } else {
        setSelectionEnd(selectionStart)
        setSelectionStart(time)
      }
    } else {
      // Start new selection
      setSelectionStart(time)
      setSelectionEnd(null)
    }
    
    seekTo(time)
  }

  // Clip management
  const updateClip = (clipId: string, updates: Partial<ClipData>) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    ))
  }

  const deleteClip = (clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId))
    setNumberOfClips(prev => prev - 1)
    if (selectedClipId === clipId) {
      setSelectedClipId(null)
    }
  }

  const addClipFromSelection = () => {
    if (selectionStart !== null && selectionEnd !== null) {
      const newClip: ClipData = {
        id: `clip-${Date.now()}`,
        title: `Clip ${clips.length + 1}`,
        startTime: selectionStart,
        endTime: selectionEnd,
        aspectRatio: '16:9'
      }
      setClips(prev => [...prev, newClip])
      setNumberOfClips(prev => prev + 1)
      setSelectionStart(null)
      setSelectionEnd(null)
    }
  }

  // Auto-generate clips
  const autoGenerateClips = () => {
    if (!duration) return
    
    const segmentLength = duration / numberOfClips
    const newClipsData: ClipData[] = []
    
    for (let i = 0; i < numberOfClips; i++) {
      const startTime = i * segmentLength
      const endTime = Math.min((i + 1) * segmentLength, duration)
      
      newClipsData.push({
        id: `clip-${Date.now()}-${i}`,
        title: `Auto Clip ${i + 1}`,
        startTime,
        endTime,
        aspectRatio: '16:9'
      })
    }
    
    setClips(newClipsData)
  }

  const handleSuggestionSelect = (suggestion: RepurposingSuggestion) => {
    const newClip: ClipData = {
      id: `clip-sugg-${Date.now()}`,
      title: suggestion.suggestedTitle,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime,
      aspectRatio: suggestion.suggestedFormat,
    };
    setClips(prev => [...prev, newClip]);
    setNumberOfClips(prev => prev + 1);
  };

  // Validate clips before saving/creating
  const validateClips = (): boolean => {
    const errors: string[] = []
    
    if (clips.length === 0) {
      errors.push('Create at least one clip')
      return false
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

  // Enhanced create clips function with validation
  const handleCreateClips = async () => {
    if (!validateClips()) return
    if (!selectedVideo) {
      setValidationErrors(['No video selected'])
      return
    }
    
    setIsCreating(true)
    setCreationProgress(0)

    try {
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        
        const formData = new FormData()
        formData.append('videoId', selectedVideo.id.toString())
        formData.append('title', clip.title)
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

      // Clear saved data after successful creation
      localStorage.removeItem(`clipEditor_${selectedVideo.id}`)

      onClipsCreated?.()
      onClose()
    } catch (error) {
      console.error('Error creating clips:', error)
      if (error instanceof Error) {
        setValidationErrors([error.message])
      } else {
        setValidationErrors(['Failed to create clips. Please try again.'])
      }
    } finally {
      setIsCreating(false)
      setCreationProgress(0)
    }
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Auto-save clips to localStorage
  useEffect(() => {
    if (!selectedVideo || !isDirty) return
    
    const saveToStorage = () => {
      const storageKey = `clipEditor_${selectedVideo.id}`
      const dataToSave = {
        clips,
        lastModified: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
      setLastSaveTime(new Date())
      setIsDirty(false)
    }

    const timerId = setTimeout(saveToStorage, 1000) // Save after 1 second of no changes
    return () => clearTimeout(timerId)
  }, [clips, selectedVideo, isDirty])

  // Load saved clips when video is selected
  useEffect(() => {
    if (!selectedVideo) return
    
    const storageKey = `clipEditor_${selectedVideo.id}`
    const savedData = localStorage.getItem(storageKey)
    if (savedData) {
      try {
        const { clips: savedClips, lastModified } = JSON.parse(savedData)
        // Only restore if less than 24 hours old
        if (new Date().getTime() - new Date(lastModified).getTime() < 24 * 60 * 60 * 1000) {
          setClips(savedClips)
          setNumberOfClips(savedClips.length)
          setLastSaveTime(new Date(lastModified))
        } else {
          localStorage.removeItem(storageKey) // Clean up old data
        }
      } catch (error) {
        console.error('Error loading saved clips:', error)
      }
    }
  }, [selectedVideo])

  // Mark as dirty whenever clips change
  useEffect(() => {
    setIsDirty(true)
  }, [clips])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              {selectedVideo ? `Create Clips from "${selectedVideo.title}"` : 'Create Clips'}
            </div>
            {isDirty && (
              <span className="text-xs text-muted-foreground">
                {lastSaveTime ? `Last saved ${lastSaveTime.toLocaleTimeString()}` : 'Saving...'}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-accent-danger/10 border border-accent-danger/30 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-destructive mb-2">Please fix these issues:</h4>
            <ul className="list-disc list-inside text-sm text-destructive">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Video Selection Section (when no video is provided) */}
        {!selectedVideo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Select Video</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVideos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2">Loading videos...</span>
                </div>
              ) : (
                <Select
                  value={selectedVideo ? (selectedVideo as Video).id.toString() : ''}
                  onValueChange={(value) => {
                    const video = availableVideos.find(v => v.id.toString() === value)
                    setSelectedVideo(video || null)
                  }}
                >
                  <SelectTrigger>
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
                              width={32}
                              height={24}
                              className="w-8 h-6 object-cover rounded"
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

        {/* Main Content (only show when video is selected) */}
        {selectedVideo && (

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <Card>
              <CardContent className="p-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={selectedVideo.url}
                    className="w-full h-64 object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                  />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex items-center gap-3 text-white">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlay}
                        className="text-white hover:text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-white hover:text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Timeline & Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timeline Bar */}
                <div
                  className="relative h-12 bg-surface border border-border rounded-lg cursor-crosshair overflow-hidden"
                  onClick={handleTimelineClick}
                >
                  {/* Progress Bar */}
                  <div
                    className="absolute top-0 left-0 h-full bg-primary/30"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  
                  {/* Current Time Indicator */}
                  <div
                    className="absolute top-0 w-0.5 h-full bg-primary"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                  
                  {/* Selection Range */}
                  {selectionStart !== null && (
                    <div
                      className="absolute top-0 h-full bg-accent-success/50"
                      style={{
                        left: `${(selectionStart / duration) * 100}%`,
                        width: selectionEnd 
                          ? `${((selectionEnd - selectionStart) / duration) * 100}%`
                          : '2px'
                      }}
                    />
                  )}
                  
                  {/* Clip Markers */}
                  {Array.isArray(clips) && clips.map((clip) => (
                    <div
                      key={clip.id}
                      className="absolute top-0 h-full border-2 border-primary bg-primary/20"
                      style={{
                        left: `${(clip.startTime / duration) * 100}%`,
                        width: `${((clip.endTime - clip.startTime) / duration) * 100}%`
                      }}
                    >
                    </div>
                  ))}
                </div>
                
                {/* Selection Info */}
                {selectionStart !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span>Selection: {formatTime(selectionStart)}</span>
                      {selectionEnd && (
                        <>
                          <span>to {formatTime(selectionEnd)}</span>
                          <span>({formatTime(selectionEnd - selectionStart)})</span>
                        </>
                      )}
                    </div>
                    {selectionEnd && (
                      <Button
                        size="sm"
                        onClick={addClipFromSelection}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Clip
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Clip Configuration Section */}
          <div className="space-y-4">
            {/* Bulk Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Quick Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Number of Clips</Label>
                  <Slider
                    value={[numberOfClips]}
                    onValueChange={([value]) => setNumberOfClips(value)}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {numberOfClips} clip{numberOfClips !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoGenerateClips}
                  className="w-full"
                >
                  Auto-Generate Clips
                </Button>
              </CardContent>
            </Card>

            {/* Individual Clips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Clip Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {Array.isArray(clips) && clips.map((clip) => (
                  <div
                    key={clip.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedClipId === clip.id ? 'border-primary/50 bg-primary/10' : 'border-border'
                    }`}
                    onClick={() => setSelectedClipId(clip.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Input
                        value={clip.title}
                        onChange={(e) => updateClip(clip.id, { title: e.target.value })}
                        className="text-sm h-8"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteClip(clip.id)
                        }}
                        className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrimmingClip(clip);
                        }}
                        className="h-8 w-8 p-0 ml-1"
                      >
                        <Scissors className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
                        <span className="text-muted-foreground">
                          ({formatTime(clip.endTime - clip.startTime)})
                        </span>
                      </div>
                      
                      <Select
                        value={clip.aspectRatio}
                        onValueChange={(value) => updateClip(clip.id, { aspectRatio: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIOS.map((ratio) => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-8 bg-primary/10 rounded overflow-hidden">
                                  <div
                                    className="absolute inset-0 border-2 border-primary"
                                    style={{
                                      aspectRatio: ratio.value,
                                      margin: 'auto',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      height: ratio.value === '9:16' ? '100%' : 'auto',
                                      width: ratio.value === '9:16' ? 'auto' : '100%'
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="font-medium">{ratio.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {ratio.platforms.join(', ')}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Conditionally render ClipTrimmer */}
            {trimmingClip && selectedVideo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Trim: {trimmingClip.title}
                    <Button variant="ghost" size="sm" onClick={() => setTrimmingClip(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClipTrimmer
                    videoSrc={selectedVideo.url}
                    initialStartTime={trimmingClip.startTime}
                    initialEndTime={trimmingClip.endTime}
                    maxDuration={duration} // Full video duration
                    onTrimChange={(newStartTime, newEndTime) => {
                      updateClip(trimmingClip.id, { startTime: newStartTime, endTime: newEndTime });
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  AI Repurposing Suggestions
                  <Button variant="outline" size="sm" onClick={() => setShowAISuggestions(!showAISuggestions)}>
                    {showAISuggestions ? 'Hide' : '✨ Show Ideas'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showAISuggestions && (
                <CardContent>
                  <AISuggestionList
                    videoId={selectedVideo.id}
                    onSuggestionSelect={handleSuggestionSelect}
                  />
                </CardContent>
              )}
            </Card>

            {/* Create Button */}
            <Button
              onClick={handleCreateClips}
              disabled={isCreating || clips.length === 0}
              className="w-full"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating... {Math.round(creationProgress)}%
                </div>
              ) : (
                <>Create {clips.length} Clip{clips.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
