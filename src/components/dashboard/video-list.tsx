'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Video {
  id: number
  title: string
  filename?: string
  url: string
  duration: number
  createdAt: string
  thumbnailUrl?: string
  clipCount: number
}

interface VideoListProps {
  onCreateClip?: (video: Video) => void
  onRefresh?: () => void
  onUploadClick?: () => void
}

export function VideoList({ onCreateClip, onRefresh, onUploadClick }: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos')
      if (response.ok) {
        const data = await response.json()
        // Ensure data is an array, handle different response formats
        if (Array.isArray(data)) {
          setVideos(data)
        } else if (data && Array.isArray(data.data)) {
          // Handle wrapped response format
          setVideos(data.data)
        } else {
          // Fallback to empty array if unexpected format
          console.warn('Unexpected API response format:', data)
          setVideos([])
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      setVideos([]) // Ensure videos is always an array
    } finally {
      setLoading(false)
    }
  }

  const syncVideos = async () => {
    setSyncing(true)
    try {
      // Call the new storage sync API to synchronize with B2
      const response = await fetch('/api/storage/sync', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy: 'smart',
          options: {
            addMissing: true,
            removeOrphaned: true,
            cleanupOrphans: false
          },
          dryRun: false
        })
      })
      
      if (response.ok) {
        const syncResult = await response.json()
        console.log('Storage sync completed:', syncResult)
        
        // Refresh the videos list after sync
        await fetchVideos()
        onRefresh?.()
      } else if (response.status === 401) {
        console.error('Authentication required for sync')
        // Could add a toast notification here
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Sync failed with status ${response.status}: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error syncing videos:', error)
      // Could add a toast notification here
    } finally {
      setSyncing(false)
    }
  }

  const formatDuration = (seconds: number): string => {
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

  const deleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setVideos(videos.filter(video => video.id !== videoId))
      } else {
        alert('Failed to delete video')
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video')
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl shadow-sm border border-border animate-pulse overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 rounded-t-xl"></div>
            <div className="p-6">
              <div className="h-5 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg mb-3"></div>
              <div className="h-4 bg-muted/30 rounded-lg w-2/3 mb-2"></div>
              <div className="h-3 bg-muted/20 rounded-lg w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!Array.isArray(videos) || videos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center">
            <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">No videos uploaded yet</h3>
        <p className="text-muted-foreground text-lg mb-6">Upload your first video to get started creating clips</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button 
            onClick={onUploadClick}
            className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary/90 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Upload Your First Video
          </Button>
          <Button 
            onClick={syncVideos}
            disabled={syncing}
            variant="outline"
            className="border-border text-foreground hover:bg-surface px-6 py-3 rounded-lg font-medium transition-all duration-200"
          >
            {syncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Storage
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sync button for when videos are present */}
      <div className="flex justify-end">
        <Button 
          onClick={syncVideos}
          disabled={syncing}
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-surface"
        >
          {syncing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Storage
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.isArray(videos) && videos.map((video) => (
        <div key={video.id} className="group bg-surface rounded-xl shadow-sm border border-border hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-muted/10 to-muted/20 relative overflow-hidden">
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
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
              className={`w-full h-full flex items-center justify-center ${video.thumbnailUrl ? 'hidden' : 'flex'}`}
              style={{ display: video.thumbnailUrl ? 'none' : 'flex' }}
            >
              <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-full p-4">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {formatDuration(video.duration)}
            </div>
            <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm text-primary text-xs px-2.5 py-1 rounded-full font-semibold">
              {video.clipCount} clips
            </div>
          </div>
          
          <div className="p-5">
            <h3 className="font-semibold text-foreground mb-2 truncate text-lg group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-1 truncate">{video.filename}</p>
            <p className="text-xs text-muted mb-4 flex items-center">
              <svg className="h-3 w-3 mr-1.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(video.createdAt)}
            </p>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => onCreateClip?.(video)}
                className="flex-1 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary/90 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4z" />
                </svg>
                Create Clip
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteVideo(video.id)}
                className="px-3 border-border hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
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
    </div>
  )
}
