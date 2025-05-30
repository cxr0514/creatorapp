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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <style jsx>{`
          .slider-thumb-blue::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .slider-thumb-blue::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `}</style>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Create New Clip</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video *
              </label>
              <select
                value={selectedVideoId || ''}
                onChange={(e) => setSelectedVideoId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!videoId}
              >
                <option value="">Select a video</option>
                {videos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.title} ({formatTime(video.duration)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Clip Title *
                </label>
                {selectedVideo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAIMetadata}
                    disabled={isGeneratingAI}
                    className="text-xs"
                  >
                    {isGeneratingAI ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        ✨ AI Enhance
                      </>
                    )}
                  </Button>
                )}
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${aiSuggested ? 'bg-blue-50 border-blue-300' : ''}`}
                placeholder="Enter clip title"
              />
              {aiSuggested && title && (
                <p className="text-xs text-blue-600 mt-1">✨ AI-enhanced title</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${aiSuggested && description ? 'bg-blue-50 border-blue-300' : ''}`}
                placeholder="Enter clip description (optional)"
              />
              {aiSuggested && description && (
                <p className="text-xs text-blue-600 mt-1">✨ AI-generated description</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hashtags
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Type hashtags separated by spaces (e.g., #trending #viral #content)"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${aiSuggested ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {hashtag}
                        <button
                          onClick={() => setHashtags(hashtags.filter((_, i) => i !== index))}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {aiSuggested && hashtags.length > 0 && (
                  <p className="text-xs text-blue-600">✨ AI-suggested hashtags</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Type tags separated by spaces (e.g., tutorial comedy education)"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${aiSuggested ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {tag}
                        <button
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {aiSuggested && tags.length > 0 && (
                  <p className="text-xs text-green-600">✨ AI-suggested tags</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (TikTok/Reels)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:3">4:3 (Standard)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Clips
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={clipCount}
                  onChange={(e) => setClipCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time (mm:ss)
                </label>
                <input
                  type="text"
                  value={formatTime(startTime)}
                  onChange={(e) => setStartTime(parseTimeInput(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0:00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time (mm:ss)
                </label>
                <input
                  type="text"
                  value={formatTime(endTime)}
                  onChange={(e) => setEndTime(parseTimeInput(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0:30"
                />
              </div>
            </div>

            {selectedVideo && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Timeline Scrubber
                </label>
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">0:00</span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="0"
                        max={selectedVideo.duration}
                        value={startTime}
                        onChange={(e) => setStartTime(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-blue"
                      />
                      <input
                        type="range"
                        min="0"
                        max={selectedVideo.duration}
                        value={endTime}
                        onChange={(e) => setEndTime(parseInt(e.target.value))}
                        className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer absolute top-0 slider-thumb-blue"
                      />
                      <div 
                        className="absolute top-1 bg-blue-500 h-1 rounded"
                        style={{
                          left: `${(startTime / selectedVideo.duration) * 100}%`,
                          width: `${((endTime - startTime) / selectedVideo.duration) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(selectedVideo.duration)}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedVideo && (
              <div className="text-sm text-gray-500 space-y-1">
                <div>Video duration: {formatTime(selectedVideo.duration)} • Clip duration: {formatTime(Math.max(0, endTime - startTime))}</div>
                <div className="text-xs">
                  {aspectRatio === '9:16' && '📱 Optimized for: TikTok, Instagram Reels, YouTube Shorts'}
                  {aspectRatio === '1:1' && '🟨 Optimized for: Instagram Posts, Twitter/X, LinkedIn'}
                  {aspectRatio === '16:9' && '🖥️ Optimized for: YouTube, Twitter/X, LinkedIn, General Web'}
                  {aspectRatio === '4:3' && '📺 Optimized for: Traditional Media, Presentations'}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateClip} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Clip'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
