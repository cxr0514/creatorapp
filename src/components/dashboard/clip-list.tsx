'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Clip {
  id: number
  title: string
  startTime: number
  endTime: number
  createdAt: string
  video: {
    id: number
    title: string
    filename: string
  }
  thumbnailUrl?: string
  status: 'processing' | 'ready' | 'failed'
}

export function ClipList() {
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClips()
  }, [])

  const fetchClips = async () => {
    try {
      const response = await fetch('/api/clips')
      if (response.ok) {
        const data = await response.json()
        setClips(data)
      }
    } catch (error) {
      console.error('Error fetching clips:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const deleteClip = async (clipId: number) => {
    if (!confirm('Are you sure you want to delete this clip?')) {
      return
    }

    try {
      const response = await fetch(`/api/clips/${clipId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setClips(clips.filter(clip => clip.id !== clipId))
      } else {
        alert('Failed to delete clip')
      }
    } catch (error) {
      console.error('Error deleting clip:', error)
      alert('Failed to delete clip')
    }
  }

  const downloadClip = async (clipId: number, title: string) => {
    try {
      const response = await fetch(`/api/clips/${clipId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title}.mp4`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download clip')
      }
    } catch (error) {
      console.error('Error downloading clip:', error)
      alert('Failed to download clip')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready'
      case 'processing':
        return 'Processing'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
            <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10L11 12L15 14V10Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clips created yet</h3>
        <p className="text-gray-500">Create your first clip from uploaded videos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clips.map((clip) => (
        <div key={clip.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="aspect-video bg-gray-100 rounded-t-lg relative overflow-hidden">
            {clip.thumbnailUrl ? (
              <img
                src={clip.thumbnailUrl}
                alt={clip.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If thumbnail fails to load, hide the image and show the fallback icon
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-full h-full flex items-center justify-center ${clip.thumbnailUrl ? 'hidden' : 'flex'}`}
              style={{ display: clip.thumbnailUrl ? 'none' : 'flex' }}
            >
              <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10L11 12L15 14V10Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
              </svg>
            </div>
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(clip.status)}`}>
                {getStatusText(clip.status)}
              </span>
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {formatTime(clip.endTime - clip.startTime)}
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-1 truncate">{clip.title}</h3>
            <p className="text-sm text-gray-500 mb-1">From: {clip.video.title}</p>
            <p className="text-xs text-gray-400 mb-3">
              {formatTime(clip.startTime)} - {formatTime(clip.endTime)} • Created {formatDate(clip.createdAt)}
            </p>
            
            <div className="flex space-x-2">
              {clip.status === 'ready' && (
                <Button
                  size="sm"
                  onClick={() => downloadClip(clip.id, clip.title)}
                  className="flex-1"
                >
                  Download
                </Button>
              )}
              {clip.status === 'processing' && (
                <Button size="sm" disabled className="flex-1">
                  Processing...
                </Button>
              )}
              {clip.status === 'failed' && (
                <Button size="sm" variant="outline" className="flex-1">
                  Retry
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteClip(clip.id)}
                className="px-3"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
