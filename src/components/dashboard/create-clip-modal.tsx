'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Video {
  id: string
  title: string
  duration: number
}

interface CreateClipModalProps {
  isOpen: boolean
  onClose: () => void
  videoId?: string
  onClipCreated?: () => void
}

export function CreateClipModal({ isOpen, onClose, videoId, onClipCreated }: CreateClipModalProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState(videoId || '')
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(30)
  const [isCreating, setIsCreating] = useState(false)

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
          startTime,
          endTime,
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
    setStartTime(0)
    setEndTime(30)
    setSelectedVideoId('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
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
                value={selectedVideoId}
                onChange={(e) => setSelectedVideoId(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clip Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter clip title"
              />
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
              <div className="text-sm text-gray-500">
                Video duration: {formatTime(selectedVideo.duration)} • 
                Clip duration: {formatTime(Math.max(0, endTime - startTime))}
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
