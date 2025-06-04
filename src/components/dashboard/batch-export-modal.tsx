'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  EXPORT_FORMATS, 
  CROPPING_STRATEGIES, 
  generateBatchExportQueue, 
  estimateBatchProcessingTime,
  // getRecommendedCroppingStrategy, // TODO: Use when implementing smart recommendations
  type BatchExportRequest,
  type ExportQueueItem,
  type ExportFormat,
  type CroppingStrategyInfo
} from '@/lib/video-export'

interface Clip {
  id: number
  title: string
  aspectRatio?: string
  startTime?: number
  endTime?: number
  duration?: number
}

interface BatchExportModalProps {
  clips: Clip[]
  isOpen: boolean
  onClose: () => void
  onExportComplete: (results: ExportQueueItem[]) => void
}

export function BatchExportModal({ clips, isOpen, onClose, onExportComplete }: BatchExportModalProps) {
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set())
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set())
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  const [croppingStrategy, setCroppingStrategy] = useState<string>('smart')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [isExporting, setIsExporting] = useState(false)
  const [exportQueue, setExportQueue] = useState<ExportQueueItem[]>([])
  const [showQueue, setShowQueue] = useState(false)

  useEffect(() => {
    if (isOpen && Array.isArray(clips)) {
      // Auto-select all passed clips and reset other state
      setSelectedClips(new Set(clips.map(clip => clip.id)))
      setSelectedFormats(new Set())
      setSelectedPlatforms(new Set())
      setCroppingStrategy('smart')
      setPriority('normal')
      setExportQueue([])
      setShowQueue(false)
    }
  }, [isOpen, clips])

  const toggleClip = (clipId: number) => {
    setSelectedClips(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clipId)) {
        newSet.delete(clipId)
      } else {
        newSet.add(clipId)
      }
      return newSet
    })
  }

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => {
      const newSet = new Set(prev)
      if (newSet.has(format)) {
        newSet.delete(format)
      } else {
        newSet.add(format)
      }
      return newSet
    })
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(platform)) {
        newSet.delete(platform)
      } else {
        newSet.add(platform)
      }
      return newSet
    })
  }

  const selectAllClips = () => {
    if (!Array.isArray(clips)) return
    
    if (selectedClips.size === clips.length) {
      setSelectedClips(new Set())
    } else {
      setSelectedClips(new Set(clips.map(clip => clip.id)))
    }
  }

  const generateQueue = () => {
    const request: BatchExportRequest = {
      clipIds: Array.from(selectedClips),
      formats: EXPORT_FORMATS.filter((f: ExportFormat) => selectedFormats.has(f.format)),
      platforms: Array.from(selectedPlatforms),
      croppingStrategy,
      priority
    }

    const queue = generateBatchExportQueue(request).map(item => ({ ...item, retryCount: 0 }))
    setExportQueue(queue)
    setShowQueue(true)
  }

  const handleRetryItem = (itemId: string) => {
    setExportQueue(prevQueue => 
      prevQueue.map(item => {
        if (item.id === itemId && item.status === 'failed') {
          return {
            ...item,
            status: 'pending',
            progress: 0,
            error: undefined,
            completedAt: undefined,
            startedAt: undefined,
            retryCount: (item.retryCount || 0) + 1,
          };
        }
        return item;
      })
    );
  };

  const startBatchExport = async () => {
    if (exportQueue.length === 0) return

    setIsExporting(true)
    const results = []

    try {
      // Process exports in chunks to avoid overwhelming the server
      const chunkSize = 3
      const chunks = []
      for (let i = 0; i < exportQueue.length; i += chunkSize) {
        chunks.push(exportQueue.slice(i, i + chunkSize))
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (queueItem) => {
          try {
            const response = await fetch(`/api/clips/${queueItem.clipId}/export`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                clipId: queueItem.clipId,
                formats: [{
                  format: queueItem.format,
                  platform: queueItem.platform
                }],
                croppingStrategy: queueItem.croppingType
              })
            })

            if (response.ok) {
              const data = await response.json()
              return {
                ...queueItem,
                status: 'completed' as const,
                progress: 100,
                result: data.results[0],
                completedAt: new Date()
              }
            } else {
              const error = await response.json()
              return {
                ...queueItem,
                status: 'failed' as const,
                progress: 0,
                error: error.error,
                completedAt: new Date()
              }
            }
          } catch (error) {
            return {
              ...queueItem,
              status: 'failed' as const,
              progress: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
              completedAt: new Date()
            }
          }
        })

        const chunkResults = await Promise.all(chunkPromises)
        results.push(...chunkResults)

        // Update queue with progress
        setExportQueue(prevQueue => 
          prevQueue.map(item => {
            const result = chunkResults.find(r => r.id === item.id)
            if (result) {
              return {
                ...item,
                status: result.status as 'pending' | 'processing' | 'completed' | 'failed',
                progress: result.progress,
                result: result.result,
                error: result.error,
                completedAt: result.status === 'completed' || result.status === 'failed' ? new Date() : undefined
              }
            }
            return item
          })
        )
      }

      onExportComplete(results)
    } catch (error) {
      console.error('Batch export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getAllPlatforms = () => {
    const platforms = new Set<string>()
    EXPORT_FORMATS.forEach((format: ExportFormat) => {
      if (selectedFormats.has(format.format)) {
        format.platforms.forEach((platform: string) => platforms.add(platform))
      }
    })
    return Array.from(platforms)
  }

  const getEstimates = () => {
    if (exportQueue.length === 0) return null
    return estimateBatchProcessingTime(exportQueue)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Batch Export</h2>
            <p className="text-sm text-muted-foreground">
              Export multiple clips to different formats and platforms
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </div>

        {!showQueue ? (
          <div className="space-y-6">
            {/* Clip Selection */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-foreground">Select Clips ({selectedClips.size}/{clips.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllClips}
                >
                  {selectedClips.size === clips.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                {Array.isArray(clips) && clips.map((clip) => (
                  <button
                    key={clip.id}
                    onClick={() => toggleClip(clip.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedClips.has(clip.id)
                        ? 'bg-primary/10 border-primary/50 text-primary'
                        : 'bg-surface border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium truncate">{clip.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {clip.aspectRatio} • {clip.duration || 0}s
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">Select Formats ({selectedFormats.size})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXPORT_FORMATS.map((format: ExportFormat) => (
                  <button
                    key={format.format}
                    onClick={() => toggleFormat(format.format)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      selectedFormats.has(format.format)
                        ? 'bg-primary/10 border-primary/50 text-primary'
                        : 'bg-surface border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">{format.displayName}</div>
                    <div className="text-sm text-muted-foreground">{format.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format.width} × {format.height} • {format.platforms.length} platforms
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Selection */}
            {selectedFormats.size > 0 && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">Select Platforms ({selectedPlatforms.size})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {getAllPlatforms().map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`p-3 rounded-lg border text-sm transition-colors ${
                        selectedPlatforms.has(platform)
                          ? 'bg-primary/10 border-primary/50 text-primary'
                          : 'bg-surface border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium capitalize">
                        {platform.replace('-', ' ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cropping Strategy */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Cropping Strategy</h4>
                <select
                  value={croppingStrategy}
                  onChange={(e) => setCroppingStrategy(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-surface text-foreground"
                >
                  {CROPPING_STRATEGIES.map((strategy: CroppingStrategyInfo) => (
                    <option key={strategy.type} value={strategy.type}>
                      {strategy.displayName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {CROPPING_STRATEGIES.find((s: CroppingStrategyInfo) => s.type === croppingStrategy)?.description}
                </p>
              </div>

              {/* Priority */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Processing Priority</h4>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                  className="w-full p-2 border border-border rounded-lg bg-surface text-foreground"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher priority jobs are processed first
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={generateQueue}
                disabled={selectedClips.size === 0 || selectedFormats.size === 0 || selectedPlatforms.size === 0}
              >
                Generate Export Queue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Queue Overview */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-foreground mb-2">Export Queue ({exportQueue.length} items)</h3>
              {(() => {
                const estimates = getEstimates()
                return estimates ? (
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>Total items: {estimates.itemCount}</div>
                    <div>Estimated time: {Math.round(estimates.totalTime / 60)}m</div>
                    <div>Avg per item: {Math.round(estimates.averagePerItem)}s</div>
                  </div>
                ) : null
              })()}
            </div>

            {/* Queue Items */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {exportQueue.map((item) => {
                const clip = clips.find(c => c.id === item.clipId)
                return (
                  <div key={item.id} className="border border-border rounded-lg p-3 bg-surface">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-foreground">
                          {clip?.title} → {item.format} ({item.platform})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.croppingType} • ~{item.estimatedTime}s
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'completed' 
                            ? 'bg-accent-success/20 text-accent-success'
                            : item.status === 'processing'
                            ? 'bg-primary/20 text-primary'
                            : item.status === 'failed'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.status} {item.retryCount && item.retryCount > 0 ? `(Retry ${item.retryCount})` : ''}
                        </span>
                        {item.status === 'processing' && (
                          <div className="w-12 h-2 bg-muted rounded-full">
                            <div 
                              className="h-2 bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                        {item.status === 'failed' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRetryItem(item.id)}
                            className="ml-2 text-xs h-6 px-2 py-1"
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                    {item.error && (
                      <div className="text-xs text-destructive mt-1">{item.error}</div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowQueue(false)}>
                Back to Setup
              </Button>
              <Button 
                onClick={startBatchExport}
                disabled={isExporting || exportQueue.length === 0}
              >
                {isExporting ? 'Processing...' : `Start Batch Export (${exportQueue.length} items)`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
