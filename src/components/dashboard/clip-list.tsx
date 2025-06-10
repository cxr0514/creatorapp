'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ExportModal } from './export-modal'
import { EnhancedBatchExportModal } from '../export/enhanced-batch-export-modal'
import { PublishingModal } from './publishing-modal'
import { WorkflowApplyModal } from './workflow-apply-modal'
import VideoJSPlayer from './video-js-player'

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
  status: 'processing' | 'ready' | 'failed' | 'error'
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
        // Ensure data is an array, handle different response formats
        if (Array.isArray(data)) {
          setClips(data)
        } else if (data && Array.isArray(data.data)) {
          // Handle wrapped response format
          setClips(data.data)
        } else {
          // Fallback to empty array if unexpected format
          console.warn('Unexpected API response format:', data)
          setClips([])
        }
      }
    } catch (error) {
      console.error('Error fetching clips:', error)
      setClips([]) // Ensure clips is always an array
    } finally {
      setLoading(false)
    }
  }

  const syncClips = async () => {
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
        
        // Refresh the clips list after sync
        await fetchClips()
        onRefresh?.()
      } else if (response.status === 401) {
        console.error('Authentication required for sync')
        // Could add a toast notification here
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Sync failed with status ${response.status}: ${errorData.error || 'Unknown error'}`)
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

  const getClipUrl = (clip: Clip): string => {
    return `/api/clips/${clip.id}/stream`
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
    console.log(`Applying workflow ${workflowId} to clip ${clipId}`)
    await new Promise(resolve => setTimeout(resolve, 1000))
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={fetchClips} disabled={loading || syncing}>Refresh Clips</Button>
        {onCreateClip && <Button onClick={onCreateClip}>Create New Clip</Button>}
        <Button onClick={syncClips} disabled={syncing || loading}>
          {syncing ? 'Syncing...' : 'Sync Storage'}
        </Button>
        <Button onClick={toggleSelectionMode}>
          {selectionMode ? 'Cancel Selection' : 'Select Clips'}
        </Button>
        {selectionMode && selectedClips.size > 0 && (
          <Button onClick={() => setBatchExportModalOpen(true)}>Batch Export ({selectedClips.size})</Button>
        )}
      </div>

      {loading ? (
        <p>Loading clips...</p>
      ) : clips.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500 mb-2">No clips found.</p>
          <p className="text-sm text-gray-400 mb-4">Try creating some clips from your videos or sync your storage.</p>
          {onCreateClip && (
            <Button onClick={onCreateClip}>Create Your First Clip</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {clips.map((clip) => (
            <div key={clip.id} className="bg-card p-4 rounded-lg shadow relative flex flex-col">
              {selectionMode && (
                <input
                  type="checkbox"
                  checked={selectedClips.has(clip.id)}
                  onChange={() => toggleClipSelection(clip.id)}
                  className="absolute top-2 left-2 z-20 h-5 w-5"
                />
              )}
              <div className="relative mb-2 aspect-video bg-muted rounded overflow-hidden group">
                {clip.status === 'ready' ? (
                  <VideoJSPlayer
                    src={getClipUrl(clip)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    {clip.status === 'processing' && (
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Processing...</p>
                      </div>
                    )}
                    {clip.status === 'failed' && (
                      <div className="text-center">
                        <div className="w-8 h-8 text-red-500 mx-auto mb-2">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876a2 2 0 001.789-2.894l-6.938-13.876a2 2 0 00-3.578 0L1.283 18.106A2 2 0 003.072 21H19.928z" />
                          </svg>
                        </div>
                        <p className="text-sm text-red-600">Processing Failed</p>
                      </div>
                    )}
                    {clip.status === 'error' && (
                      <div className="text-center">
                        <div className="w-8 h-8 text-red-500 mx-auto mb-2">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876a2 2 0 001.789-2.894l-6.938-13.876a2 2 0 00-3.578 0L1.283 18.106A2 2 0 003.072 21H19.928z" />
                          </svg>
                        </div>
                        <p className="text-sm text-red-600">Error</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-lg truncate" title={clip.title}>{clip.title}</h3>
                {clip.description && (
                  <p className="text-sm text-muted-foreground mt-1 truncate" title={clip.description}>{clip.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Duration: {formatTime(clip.endTime - clip.startTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {formatDate(clip.createdAt)}
                </p>
                {clip.aspectRatio && (
                  <p className="text-xs text-muted-foreground">Aspect Ratio: {clip.aspectRatio}</p>
                )}
                 {clip.status === 'ready' && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-300">Ready</span>
                )}
                {clip.status === 'processing' && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900 dark:text-yellow-300">Processing</span>
                )}
                {(clip.status === 'failed' || clip.status === 'error') && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-300">
                      {clip.status === 'error' ? 'Error' : 'Failed'}
                    </span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2 items-center">
                <Button variant="outline" size="sm" onClick={() => openExportModal(clip)}>Export</Button>
                <Button variant="outline" size="sm" onClick={() => openPublishModal(clip)}>Publish</Button>
                <Button variant="outline" size="sm" onClick={() => openWorkflowModal(clip)}>Apply Workflow</Button>
              </div>
            </div>
          ))}
        </div>
      )}

    {/* Export Modal */}
    {selectedClip && exportModalOpen && (
      <ExportModal
        isOpen={exportModalOpen}
        onClose={closeExportModal}
        clip={selectedClip}
        onExportComplete={handleExportComplete}
      />
    )}

    {/* Batch Export Modal */}
    {batchExportModalOpen && (
        <EnhancedBatchExportModal
            isOpen={batchExportModalOpen}
            onClose={() => setBatchExportModalOpen(false)}
            clips={clips.filter(c => selectedClips.has(c.id))} // Prop name is `clips`
            onExportComplete={() => {
                fetchClips();
                setBatchExportModalOpen(false);
                setSelectedClips(new Set());
                setSelectionMode(false);
            }}
        />
    )}


    {/* Publishing Modal */}
    {selectedClip && publishModalOpen && (
      <PublishingModal
        isOpen={publishModalOpen}
        onClose={closePublishModal}
        clip={selectedClip}
        onPublishComplete={handlePublishComplete}
      />
    )}

    {/* Workflow Apply Modal */}
    {selectedClip && workflowModalOpen && (
      <WorkflowApplyModal
        isOpen={workflowModalOpen}
        onClose={closeWorkflowModal}
        clip={selectedClip}
        onApplyWorkflow={async (clipId: number, workflowId: string) => { // Corrected: Prop signature now matches definition
            await handleApplyWorkflow(clipId, workflowId);
        }}
      />
    )}
    </div>
  );
}
