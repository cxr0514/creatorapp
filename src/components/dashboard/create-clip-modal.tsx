'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Video {
  id: number
  title: string
  duration: number
}

interface CreateClipModalProps {
  isOpen: boolean
  onClose: () => void
  videoId?: number
  onClipCreated?: () => void
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
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [clipCount, setClipCount] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiSuggested, setAiSuggested] = useState(false)

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

  const generateAIMetadata = async () => {
    if (!selectedVideo) return

    setIsGeneratingAI(true)
    try {
      const response = await fetch('/api/ai/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clip',
          videoTitle: selectedVideo.title,
          videoDuration: selectedVideo.duration,
          startTime,
          endTime,
          aspectRatio,
          existingTitle: title,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const metadata = data.metadata
        
        // Auto-fill the form with AI suggestions, but allow user editing
        if (metadata.title && !title) setTitle(metadata.title)
        if (metadata.description) setDescription(metadata.description)
        if (metadata.hashtags) setHashtags(metadata.hashtags)
        if (metadata.tags) setTags(metadata.tags)
        
        setAiSuggested(true)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to generate AI metadata')
      }
    } catch (error) {
      console.error('Error generating AI metadata:', error)
      alert('Failed to generate AI metadata')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const parseTimeInput = (timeString: string): number => {
    const parts = timeString.split(':')
    const minutes = parseInt(parts[0] || '0', 10)
    const seconds = parseInt(parts[1] || '0', 10)
    return minutes * 60 + seconds
  }

  const handleCreateClip = async () => {
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
      const response = await fetch('/api/clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: selectedVideoId,
          title: title.trim(),
          description: description.trim() || null,
          hashtags,
          tags,
          startTime,
          endTime,
          aspectRatio,
          clipCount,
        }),
      })

      if (response.ok) {
        onClipCreated?.()
        handleClose()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create clip')
      }
    } catch (error) {
      console.error('Error creating clip:', error)
      alert('Failed to create clip')
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
    setAspectRatio('16:9')
    setClipCount(1)
    setSelectedVideoId(undefined)
    setAiSuggested(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <style jsx>{`
          .slider-thumb-purple::-webkit-slider-thumb {
            appearance: none;
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: var(--primary);
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          }
          .slider-thumb-purple::-moz-range-thumb {
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: var(--primary);
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          }
        `}</style>
        
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Select Video *
              </label>
              <select
                value={selectedVideoId || ''}
                onChange={(e) => setSelectedVideoId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                disabled={!!videoId}
              >
                <option value="">Choose a video to create clips from</option>
                {videos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.title} ({formatTime(video.duration)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-foreground">
                  Clip Title *
                </label>
                {selectedVideo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAIMetadata}
                    disabled={isGeneratingAI}
                    className="text-xs border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
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
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Enhance
                      </>
                    )}
                  </Button>
                )}
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  aiSuggested 
                    ? 'bg-primary/10 border-primary focus:ring-primary focus:border-primary' 
                    : 'border-gray-300 focus:ring-primary focus:border-primary'
                }`}
                placeholder="Enter an engaging title for your clip"
              />
              {aiSuggested && title && (
                <p className="text-xs text-primary mt-2 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI-enhanced title
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                  aiSuggested && description 
                    ? 'bg-primary/10 border-primary focus:ring-primary focus:border-primary' 
                    : 'border-gray-300 focus:ring-primary focus:border-primary'
                }`}
                placeholder="Describe your clip to help with discovery (optional)"
              />
              {aiSuggested && description && (
                <p className="text-xs text-primary mt-2 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI-generated description
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Hashtags
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type hashtags and press Enter (e.g., trending viral content)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      const value = e.currentTarget.value.trim()
                      if (value && !hashtags.includes(value)) {
                        const formattedHashtag = value.startsWith('#') ? value : `#${value}`
                        setHashtags([...hashtags, formattedHashtag])
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                />
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                          aiSuggested 
                            ? 'bg-primary/10 text-primary border-primary/50' 
                            : 'bg-muted/20 text-gray-700 border-gray-200'
                        }`}
                      >
                        {hashtag}
                        <button
                          onClick={() => setHashtags(hashtags.filter((_, i) => i !== index))}
                          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {aiSuggested && hashtags.length > 0 && (
                  <p className="text-xs text-blue-600 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI-suggested hashtags
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Tags
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type tags and press Enter (e.g., tutorial comedy education)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      const value = e.currentTarget.value.trim()
                      if (value && !tags.includes(value)) {
                        setTags([...tags, value])
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                          aiSuggested 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-muted/20 text-gray-700 border-gray-200'
                        }`}
                      >
                        {tag}
                        <button
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
                          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {aiSuggested && tags.length > 0 && (
                  <p className="text-xs text-green-600 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI-suggested tags
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (TikTok/Reels)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:3">4:3 (Standard)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Number of Clips
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={clipCount}
                  onChange={(e) => setClipCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Start Time
                </label>
                <input
                  type="text"
                  value={formatTime(startTime)}
                  onChange={(e) => setStartTime(parseTimeInput(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="0:00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  End Time
                </label>
                <input
                  type="text"
                  value={formatTime(endTime)}
                  onChange={(e) => setEndTime(parseTimeInput(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="0:30"
                />
              </div>
            </div>

            {selectedVideo && (
              <div className="space-y-4 bg-muted/20 rounded-xl p-4">
                <label className="block text-sm font-semibold text-foreground">
                  Timeline Selection
                </label>
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-gray-600 w-12">0:00</span>
                    <div className="flex-1 relative h-6 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max={selectedVideo.duration}
                        value={startTime}
                        onChange={(e) => setStartTime(parseInt(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-purple"
                      />
                      <input
                        type="range"
                        min="0"
                        max={selectedVideo.duration}
                        value={endTime}
                        onChange={(e) => setEndTime(parseInt(e.target.value))}
                        className="w-full h-3 bg-transparent rounded-lg appearance-none cursor-pointer absolute top-0 slider-thumb-purple"
                      />
                      <div 
                        className="absolute top-1.5 bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full shadow-sm"
                        style={{
                          left: `${(startTime / selectedVideo.duration) * 100}%`,
                          width: `${((endTime - startTime) / selectedVideo.duration) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-12 text-right">{formatTime(selectedVideo.duration)}</span>
                  </div>
                </div>
                
                <div className="bg-surface rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-foreground">Video duration:</span>
                      <span className="text-gray-600 ml-1">{formatTime(selectedVideo.duration)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Clip duration:</span>
                      <span className="text-primary font-semibold ml-1">{formatTime(Math.max(0, endTime - startTime))}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center">
                    {aspectRatio === '9:16' && (
                      <>
                        <span className="mr-1">📱</span>
                        <span>Optimized for: TikTok, Instagram Reels, YouTube Shorts</span>
                      </>
                    )}
                    {aspectRatio === '1:1' && (
                      <>
                        <span className="mr-1">🟨</span>
                        <span>Optimized for: Instagram Posts, Twitter/X, LinkedIn</span>
                      </>
                    )}
                    {aspectRatio === '16:9' && (
                      <>
                        <span className="mr-1">🖥️</span>
                        <span>Optimized for: YouTube, Twitter/X, LinkedIn, General Web</span>
                      </>
                    )}
                    {aspectRatio === '4:3' && (
                      <>
                        <span className="mr-1">📺</span>
                        <span>Optimized for: Traditional Media, Presentations</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isCreating}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-muted/20 rounded-lg transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateClip} 
              disabled={isCreating || !selectedVideoId || !title.trim()}
              className="px-6 py-2 bg-gradient-to-r from-primary to-primary/90 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Clip...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4z" />
                  </svg>
                  Create Clip
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
