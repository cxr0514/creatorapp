'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ExportModal } from './export-modal'
import { BatchExportModal } from './batch-export-modal'
import { PublishingModal } from './publishing-modal'
import { WorkflowApplyModal } from './workflow-apply-modal'

interface Clip {
  id: number
  title: string
  startTime: number
  endTime: number
  aspectRatio?: string
  createdAt: string
  video: {
    id: number
    title: string
    filename: string
  }
  thumbnailUrl?: string
  status: 'processing' | 'ready' | 'failed'
  description?: string
  hashtags?: string[]
  tags?: string[]
}

interface ClipListProps {
  onRefresh?: () => void
  onCreateClip?: () => void
}

export function ClipList({ onRefresh, onCreateClip }: ClipListProps = {}) {
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [batchExportModalOpen, setBatchExportModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null)
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)

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

  const syncClips = async () => {
    setSyncing(true)
    try {
      // Call the sync endpoint to refresh from Cloudinary with credentials
      const response = await fetch('/api/clips?sync=true', {
        credentials: 'include', // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setClips(data)
        onRefresh?.()
      } else if (response.status === 401) {
        console.error('Authentication required for sync')
        // Could add a toast notification here
      } else {
        throw new Error(`Sync failed with status ${response.status}`)
      }
    } catch (error) {
      console.error('Error syncing clips:', error)
      // Could add a toast notification here
    } finally {
      setSyncing(false)
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

  const openExportModal = (clip: Clip) => {
    setSelectedClip(clip)
    setExportModalOpen(true)
  }

  const closeExportModal = () => {
    setExportModalOpen(false)
    setSelectedClip(null)
  }

  const handleExportComplete = () => {
    // Refresh clips list to show any updates
    fetchClips()
  }

  const openPublishModal = (clip: Clip) => {
    setSelectedClip(clip)
    setPublishModalOpen(true)
  }

  const closePublishModal = () => {
    setPublishModalOpen(false)
    setSelectedClip(null)
  }

  const handlePublishComplete = () => {
    // Refresh clips list and close modal
    fetchClips()
    closePublishModal()
  }

  const openWorkflowModal = (clip: Clip) => {
    setSelectedClip(clip)
    setWorkflowModalOpen(true)
  }

  const closeWorkflowModal = () => {
    setWorkflowModalOpen(false)
    setSelectedClip(null)
  }

  const handleApplyWorkflow = async (clipId: number, workflowId: string) => {
    // In a real app, this would make an API call to apply the workflow
    // For now, we'll simulate the workflow application
    console.log(`Applying workflow ${workflowId} to clip ${clipId}`)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Refresh clips list
    fetchClips()
  }

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    setSelectedClips(new Set())
  }

  const toggleClipSelection = (clipId: number) => {
    const newSelected = new Set(selectedClips)
    if (newSelected.has(clipId)) {
      newSelected.delete(clipId)
    } else {
      newSelected.add(clipId)
    }
    setSelectedClips(newSelected)
  }

  const selectAllClips = () => {
    const readyClipIds = clips.filter(clip => clip.status === 'ready').map(clip => clip.id)
    setSelectedClips(new Set(readyClipIds))
  }

  const clearSelection = () => {
    setSelectedClips(new Set())
  }

  const openBatchExportModal = () => {
    setBatchExportModalOpen(true)
  }

  const closeBatchExportModal = () => {
    setBatchExportModalOpen(false)
    setSelectionMode(false)
    setSelectedClips(new Set())
  }

  const handleBatchExportComplete = () => {
    // Refresh clips list and close batch modal
    fetchClips()
    closeBatchExportModal()
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
        return 'bg-green-100 text-green-700 border border-green-200'
      case 'processing':
        return 'bg-purple-100 text-purple-700 border border-purple-200'
      case 'failed':
        return 'bg-red-100 text-red-700 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded-t-xl"></div>
            <div className="p-6">
              <div className="h-5 bg-gradient-to-r from-purple-200 to-purple-300 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded-lg w-1/2 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded-lg flex-1"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
            <svg className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">No clips created yet</h3>
        <p className="text-gray-500 text-lg mb-6">Upload videos and create your first clips to get started</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button 
            onClick={onCreateClip}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Create Your First Clip
          </Button>
          <Button 
            onClick={syncClips}
            disabled={syncing}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-lg font-medium transition-all duration-200"
          >
            {syncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    <>
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {!selectionMode ? (
            <Button 
              onClick={toggleSelectionMode}
              variant="outline"
              size="sm"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Batch Export
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {selectedClips.size} of {clips.filter(c => c.status === 'ready').length} selected
              </span>
              <Button 
                onClick={selectAllClips}
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Select All
              </Button>
              <Button 
                onClick={clearSelection}
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Clear
              </Button>
              <Button 
                onClick={openBatchExportModal}
                disabled={selectedClips.size === 0}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Export Selected ({selectedClips.size})
              </Button>
              <Button 
                onClick={toggleSelectionMode}
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        <Button 
          onClick={syncClips}
          disabled={syncing}
          variant="outline"
          size="sm"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          {syncing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      {clips.map((clip) => (
        <div key={clip.id} className={`group bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${
          selectionMode && selectedClips.has(clip.id) 
            ? 'border-purple-300 shadow-lg ring-2 ring-purple-200' 
            : selectionMode 
              ? 'border-gray-200 hover:border-purple-200' 
              : 'border-gray-100 hover:shadow-lg hover:border-purple-200'
        }`}>
          {/* Selection Checkbox */}
          {selectionMode && clip.status === 'ready' && (
            <div className="absolute top-3 left-3 z-10">
              <input
                type="checkbox"
                checked={selectedClips.has(clip.id)}
                onChange={() => toggleClipSelection(clip.id)}
                className="w-5 h-5 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
            </div>
          )}
          
          <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
            {clip.thumbnailUrl ? (
              <Image
                src={clip.thumbnailUrl}
                alt={clip.title}
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
              className={`w-full h-full flex items-center justify-center ${clip.thumbnailUrl ? 'hidden' : 'flex'}`}
              style={{ display: clip.thumbnailUrl ? 'none' : 'flex' }}
            >
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-full p-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8l4 4z" />
                </svg>
              </div>
            </div>
            <div className={`absolute top-3 right-3 ${selectionMode ? 'top-3' : 'top-3'}`}>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(clip.status)}`}>
                {getStatusText(clip.status)}
              </span>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {formatTime(clip.endTime - clip.startTime)}
            </div>
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-purple-700 text-xs px-2.5 py-1 rounded-full font-semibold">
              {clip.aspectRatio || '16:9'}
            </div>
          </div>
          
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-2 truncate text-lg group-hover:text-purple-700 transition-colors">{clip.title}</h3>
            <p className="text-sm text-gray-600 mb-1 truncate">From: {clip.video.title}</p>
            <p className="text-xs text-gray-500 mb-1 flex items-center">
              <svg className="h-3 w-3 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
            </p>
            <p className="text-xs text-gray-500 mb-3 flex items-center">
              <svg className="h-3 w-3 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(clip.createdAt)}
            </p>
            
            {/* Description */}
            {clip.description && (
              <div className="mb-3">
                <p className="text-sm text-gray-700 overflow-hidden" 
                   style={{
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical'
                   }}
                   title={clip.description}>
                  {clip.description}
                </p>
              </div>
            )}
            
            {/* Hashtags */}
            {clip.hashtags && clip.hashtags.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {clip.hashtags.slice(0, 3).map((hashtag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      title="AI-generated hashtag"
                    >
                      <svg className="w-3 h-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                      #{hashtag}
                    </span>
                  ))}
                  {clip.hashtags.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{clip.hashtags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Tags */}
            {clip.tags && clip.tags.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {clip.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                      title="AI-generated tag"
                    >
                      <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                      {tag}
                    </span>
                  ))}
                  {clip.tags.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{clip.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {clip.status === 'ready' && (
                <>
                  {/* First row of buttons */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => downloadClip(clip.id, clip.title)}
                      disabled={selectionMode}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openExportModal(clip)}
                      disabled={selectionMode}
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Export
                    </Button>
                  </div>
                  
                  {/* Second row of buttons */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPublishModal(clip)}
                      disabled={selectionMode}
                      className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m5 0H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM9 12l2 2 4-4" />
                      </svg>
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openWorkflowModal(clip)}
                      disabled={selectionMode}
                      className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M14.25 3.104c.251.023.501.05.75.082M19.8 14.5l-2.407 2.407A2.25 2.25 0 0116.001 17.5H8.001a2.25 2.25 0 01-1.392-.493L4.2 14.5" />
                      </svg>
                      Workflow
                    </Button>
                  </div>
                </>
              )}
              {clip.status === 'processing' && (
                <Button size="sm" disabled className="flex-1 bg-purple-100 text-purple-600 rounded-lg">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </Button>
              )}
              {clip.status === 'failed' && (
                <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 rounded-lg">
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteClip(clip.id)}
                className="px-3 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-lg"
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
    
    {/* Export Modal */}
    {selectedClip && (
      <ExportModal
        clip={selectedClip}
        isOpen={exportModalOpen}
        onClose={closeExportModal}
        onExportComplete={handleExportComplete}
      />
    )}
    
    {/* Publishing Modal */}
    {selectedClip && (
      <PublishingModal
        clip={selectedClip}
        isOpen={publishModalOpen}
        onClose={closePublishModal}
        onPublishComplete={handlePublishComplete}
      />
    )}
    
    {/* Workflow Apply Modal */}
    <WorkflowApplyModal
      isOpen={workflowModalOpen}
      onClose={closeWorkflowModal}
      clip={selectedClip}
      onApplyWorkflow={handleApplyWorkflow}
    />
    
    {/* Batch Export Modal */}
    <BatchExportModal
      isOpen={batchExportModalOpen}
      onClose={closeBatchExportModal}
      clips={clips.filter(clip => selectedClips.has(clip.id))}
      onExportComplete={handleBatchExportComplete}
    />
    </>
  )
}
