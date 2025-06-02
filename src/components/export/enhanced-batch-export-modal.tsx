'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  EXPORT_FORMATS, 
  CROPPING_STRATEGIES, 
  generateBatchExportQueue, 
  estimateBatchProcessingTime,
  type BatchExportRequest,
  type ExportQueueItem,
  type ExportFormat
} from '@/lib/video-export'
import { smartCroppingEngine, type SmartCropAnalysis } from '@/lib/smart-cropping-engine'
import { ExportPreviewModal } from './export-preview-modal'
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Eye,
  Sparkles,
  Video,
  Settings,
  Download
} from 'lucide-react'

interface Clip {
  id: number
  title: string
  cloudinaryId?: string
  aspectRatio?: string
  startTime?: number
  endTime?: number
  duration?: number
  thumbnailUrl?: string
}

interface EnhancedExportQueueItem extends ExportQueueItem {
  smartCropAnalysis?: SmartCropAnalysis
  estimatedDuration?: number
}

interface EnhancedBatchExportModalProps {
  clips: Clip[]
  isOpen: boolean
  onClose: () => void
  onExportComplete: (results: EnhancedExportQueueItem[]) => void
}

export function EnhancedBatchExportModal({ 
  clips, 
  isOpen, 
  onClose, 
  onExportComplete 
}: EnhancedBatchExportModalProps) {
  // Selection state
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set())
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set())
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())
  
  // Export configuration
  const [croppingStrategy, setCroppingStrategy] = useState<string>('smart')
  const [useSmartCropping, setUseSmartCropping] = useState(true)
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [qualityLevel, setQualityLevel] = useState<'standard' | 'high' | 'ultra'>('high')
  
  // Queue state
  const [exportQueue, setExportQueue] = useState<EnhancedExportQueueItem[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTab, setCurrentTab] = useState<'setup' | 'queue' | 'results'>('setup')
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [previewClip, setPreviewClip] = useState<Clip | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedClips(new Set(clips.map(clip => clip.id)))
      setSelectedFormats(new Set())
      setSelectedPlatforms(new Set())
      setCroppingStrategy('smart')
      setUseSmartCropping(true)
      setPriority('normal')
      setQualityLevel('high')
      setExportQueue([])
      setCurrentTab('setup')
      setIsExporting(false)
      setIsPaused(false)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }, [isOpen, clips])

  // Selection handlers
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
    if (selectedClips.size === clips.length) {
      setSelectedClips(new Set())
    } else {
      setSelectedClips(new Set(clips.map(clip => clip.id)))
    }
  }

  // Queue generation
  const generateQueue = async () => {
    const request: BatchExportRequest = {
      clipIds: Array.from(selectedClips),
      formats: EXPORT_FORMATS.filter((f: ExportFormat) => selectedFormats.has(f.format)),
      platforms: Array.from(selectedPlatforms),
      croppingStrategy,
      priority
    }

    const queue = generateBatchExportQueue(request).map(item => ({ 
      ...item, 
      estimatedDuration: Math.floor(Math.random() * 60) + 30 // Rough estimate
    })) as EnhancedExportQueueItem[]

    // Add smart crop analysis if enabled
    if (useSmartCropping) {
      setIsAnalyzing(true)
      setAnalysisProgress(0)

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i]
        const clip = clips.find(c => c.id === item.clipId)
        
        if (clip?.cloudinaryId) {
          try {
            const contentAnalysis = await smartCroppingEngine.analyzeContent()
            const targetFormat = EXPORT_FORMATS.find(f => f.format === item.format)
            
            if (targetFormat) {
              const strategy = await smartCroppingEngine.determineCroppingStrategy(
                clip.aspectRatio || '16:9',
                targetFormat,
                contentAnalysis
              )
              
              queue[i] = {
                ...item,
                smartCropAnalysis: {
                  strategy: strategy.strategy,
                  confidence: strategy.confidence,
                  focusArea: strategy.focusArea,
                  reasoning: strategy.reasoning
                }
              }
            }
          } catch (error) {
            console.error('Analysis failed for clip', clip.id, error)
          }
        }
        
        setAnalysisProgress(((i + 1) / queue.length) * 100)
      }
      
      setIsAnalyzing(false)
    }

    setExportQueue(queue)
    setCurrentTab('queue')
  }

  // Export processing
  const startBatchExport = async () => {
    if (exportQueue.length === 0) return

    setIsExporting(true)
    const results: EnhancedExportQueueItem[] = []

    try {
      // Process exports in chunks
      const chunkSize = 3
      const chunks = []
      for (let i = 0; i < exportQueue.length; i += chunkSize) {
        chunks.push(exportQueue.slice(i, i + chunkSize))
      }

      for (const chunk of chunks) {
        if (isPaused) {
          // Wait for resume
          await new Promise(resolve => {
            const checkPause = () => {
              if (!isPaused) {
                resolve(void 0)
              } else {
                setTimeout(checkPause, 1000)
              }
            }
            checkPause()
          })
        }

        const chunkPromises = chunk.map(async (queueItem) => {
          try {
            // Update status to processing
            setExportQueue(prev => 
              prev.map(item => 
                item.id === queueItem.id 
                  ? { ...item, status: 'processing', startedAt: new Date() }
                  : item
              )
            )

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
                croppingStrategy: queueItem.croppingType,
                useSmartCropping,
                qualityLevel
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

        // Update queue with results
        setExportQueue(prevQueue => 
          prevQueue.map(item => {
            const result = chunkResults.find(r => r.id === item.id)
            return result || item
          })
        )
      }

      setCurrentTab('results')
      onExportComplete(results)
    } catch (error) {
      console.error('Batch export error:', error)
    } finally {
      setIsExporting(false)
      setIsPaused(false)
    }
  }

  const pauseExport = () => setIsPaused(!isPaused)

  const retryFailedItems = () => {
    setExportQueue(prev => 
      prev.map(item => 
        item.status === 'failed' 
          ? { ...item, status: 'pending', progress: 0, error: undefined, retryCount: (item.retryCount || 0) + 1 }
          : item
      )
    )
  }

  const downloadResults = () => {
    const completedItems = exportQueue.filter(item => item.status === 'completed' && item.result?.url)
    
    completedItems.forEach(item => {
      if (item.result?.url) {
        const link = document.createElement('a')
        link.href = item.result.url
        link.download = `${item.clipId}_${item.format}_${item.platform}.mp4`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    })
  }

  // Helper functions
  const getAllPlatforms = () => {
    const platforms = new Set<string>()
    EXPORT_FORMATS.forEach((format: ExportFormat) => {
      if (selectedFormats.has(format.format)) {
        format.platforms.forEach((platform: string) => platforms.add(platform))
      }
    })
    return Array.from(platforms)
  }

  const getQueueStats = () => {
    const completed = exportQueue.filter(item => item.status === 'completed').length
    const failed = exportQueue.filter(item => item.status === 'failed').length
    const processing = exportQueue.filter(item => item.status === 'processing').length
    const pending = exportQueue.filter(item => item.status === 'pending').length
    
    return { completed, failed, processing, pending, total: exportQueue.length }
  }

  const getEstimates = () => {
    if (exportQueue.length === 0) return null
    return estimateBatchProcessingTime(exportQueue)
  }

  if (!isOpen) return null

  const stats = getQueueStats()
  const estimates = getEstimates()

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-500" />
                Smart Batch Export
              </h2>
              <p className="text-sm text-gray-500">
                Export multiple clips with AI-powered smart cropping
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'setup' | 'queue' | 'results')} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="setup" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Queue ({exportQueue.length})
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Results ({stats.completed}/{stats.total})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="setup" className="space-y-6 mt-0">
                {/* Clip Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Select Clips ({selectedClips.size}/{clips.length})
                      <Button variant="outline" onClick={selectAllClips}>
                        {selectedClips.size === clips.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clips.map((clip) => (
                        <div 
                          key={clip.id}
                          className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedClips.has(clip.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => toggleClip(clip.id)}
                        >
                          <Checkbox 
                            checked={selectedClips.has(clip.id)}
                            className="absolute top-2 right-2"
                          />
                          {clip.thumbnailUrl && (
                            <Image 
                              src={clip.thumbnailUrl} 
                              alt={clip.title}
                              width={200}
                              height={96}
                              className="w-full h-24 object-cover rounded mb-2"
                            />
                          )}
                          <h4 className="font-medium text-sm">{clip.title}</h4>
                          <p className="text-xs text-gray-500">
                            {clip.aspectRatio} • {clip.duration}s
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewClip(clip)
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Format Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Export Formats ({selectedFormats.size})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {EXPORT_FORMATS.map((format) => (
                        <div
                          key={format.format}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedFormats.has(format.format) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => toggleFormat(format.format)}
                        >
                          <Checkbox 
                            checked={selectedFormats.has(format.format)}
                            className="mb-2"
                          />
                          <h4 className="font-medium">{format.format}</h4>
                          <p className="text-sm text-gray-500">{format.description}</p>
                          <div className="mt-2">
                            {format.platforms.slice(0, 2).map((platform) => (
                              <Badge key={platform} variant="secondary" className="mr-1 text-xs">
                                {platform}
                              </Badge>
                            ))}
                            {format.platforms.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{format.platforms.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Selection */}
                {selectedFormats.size > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Target Platforms ({selectedPlatforms.size})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {getAllPlatforms().map((platform) => (
                          <div
                            key={platform}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedPlatforms.has(platform) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                            onClick={() => togglePlatform(platform)}
                          >
                            <Checkbox 
                              checked={selectedPlatforms.has(platform)}
                              className="mb-2"
                            />
                            <h4 className="font-medium">{platform}</h4>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Export Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Export Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Cropping Strategy</label>
                        <Select value={croppingStrategy} onValueChange={setCroppingStrategy}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CROPPING_STRATEGIES.map((strategy) => (
                              <SelectItem key={strategy.type} value={strategy.type}>
                                {strategy.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Quality Level</label>
                        <Select value={qualityLevel} onValueChange={(value) => setQualityLevel(value as 'standard' | 'high' | 'ultra')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="ultra">Ultra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Priority</label>
                        <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'normal' | 'high')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="smart-cropping"
                        checked={useSmartCropping}
                        onCheckedChange={(checked) => setUseSmartCropping(checked === true)}
                      />
                      <label htmlFor="smart-cropping" className="text-sm font-medium">
                        Enable AI-powered smart cropping
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Queue Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={generateQueue}
                    disabled={selectedClips.size === 0 || selectedFormats.size === 0 || isAnalyzing}
                    className="px-8 py-3"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing... {Math.round(analysisProgress)}%
                      </>
                    ) : (
                      'Generate Export Queue'
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="queue" className="mt-0">
                {exportQueue.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No export queue generated yet</p>
                      <Button variant="outline" onClick={() => setCurrentTab('setup')} className="mt-4">
                        Go to Setup
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Queue Controls */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Export Queue ({exportQueue.length} items)
                          <div className="flex gap-2">
                            {stats.failed > 0 && (
                              <Button variant="outline" onClick={retryFailedItems}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Retry Failed
                              </Button>
                            )}
                            {isExporting ? (
                              <Button variant="outline" onClick={pauseExport}>
                                {isPaused ? (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                  </>
                                ) : (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button onClick={startBatchExport} disabled={exportQueue.length === 0}>
                                <Play className="h-4 w-4 mr-2" />
                                Start Export
                              </Button>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
                            <div className="text-sm text-gray-500">Pending</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
                            <div className="text-sm text-gray-500">Processing</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                            <div className="text-sm text-gray-500">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                            <div className="text-sm text-gray-500">Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-sm text-gray-500">Total</div>
                          </div>
                        </div>
                        
                        {stats.total > 0 && (
                          <Progress 
                            value={(stats.completed / stats.total) * 100} 
                            className="w-full h-2"
                          />
                        )}

                        {estimates && (
                          <div className="mt-4 text-sm text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Est. {Math.ceil(estimates.totalTime)} min
                            </span>
                            <span>Items: {estimates.itemCount}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Queue Items */}
                    <div className="space-y-3">
                      {exportQueue.map((item) => {
                        const clip = clips.find(c => c.id === item.clipId)
                        return (
                          <Card key={item.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                    {item.status === 'completed' && <CheckCircle className="h-6 w-6 text-green-500" />}
                                    {item.status === 'failed' && <XCircle className="h-6 w-6 text-red-500" />}
                                    {item.status === 'processing' && (
                                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                                    )}
                                    {item.status === 'pending' && <Clock className="h-6 w-6 text-gray-400" />}
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium">{clip?.title}</h4>
                                    <p className="text-sm text-gray-500">
                                      {item.format} • {item.platform}
                                    </p>
                                    {item.smartCropAnalysis && (
                                      <p className="text-xs text-blue-600">
                                        Smart crop: {item.smartCropAnalysis.strategy} 
                                        ({Math.round(item.smartCropAnalysis.confidence * 100)}% confidence)
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <Badge variant={
                                    item.status === 'completed' ? 'default' :
                                    item.status === 'failed' ? 'destructive' :
                                    item.status === 'processing' ? 'secondary' : 'outline'
                                  }>
                                    {item.status}
                                  </Badge>
                                  {item.error && (
                                    <p className="text-xs text-red-500 mt-1">{item.error}</p>
                                  )}
                                  {(item.retryCount || 0) > 0 && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                      Retry #{item.retryCount || 0}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {item.status === 'processing' && (
                                <Progress value={item.progress} className="mt-3" />
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="results" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Export Results
                        {stats.completed > 0 && (
                          <Button onClick={downloadResults}>
                            <Download className="h-4 w-4 mr-2" />
                            Download All ({stats.completed})
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.completed === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No completed exports yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {exportQueue
                            .filter(item => item.status === 'completed' && item.result)
                            .map((item) => {
                              const clip = clips.find(c => c.id === item.clipId)
                              return (
                                <Card key={item.id}>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <h4 className="font-medium">{clip?.title}</h4>
                                        <p className="text-sm text-gray-500">
                                          {item.format} • {item.platform}
                                        </p>
                                      </div>
                                      
                                      {item.result?.url && (
                                        <video 
                                          src={item.result.url}
                                          className="w-full h-32 object-cover rounded bg-gray-100"
                                          controls
                                        />
                                      )}

                                      {item.smartCropAnalysis && (
                                        <div className="text-xs bg-blue-50 p-2 rounded">
                                          <strong>Smart Crop Applied:</strong><br />
                                          Strategy: {item.smartCropAnalysis.strategy}<br />
                                          Confidence: {Math.round(item.smartCropAnalysis.confidence * 100)}%<br />
                                          Reason: {item.smartCropAnalysis.reasoning}
                                        </div>
                                      )}

                                      <Button 
                                        variant="outline" 
                                        className="w-full"
                                        onClick={() => {
                                          if (item.result?.url) {
                                            const link = document.createElement('a')
                                            link.href = item.result.url
                                            link.download = `${clip?.title}_${item.format}_${item.platform}.mp4`
                                            link.click()
                                          }
                                        }}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Preview Modal */}
      {previewClip && (
        <ExportPreviewModal
          clip={{
            ...previewClip,
            videoId: previewClip.id,
            startTime: previewClip.startTime || 0,
            endTime: previewClip.endTime || previewClip.duration || 0,
            aspectRatio: previewClip.aspectRatio || '16:9',
            video: {
              url: previewClip.thumbnailUrl || '',
              publicId: previewClip.cloudinaryId || '',
              duration: previewClip.duration || 0
            }
          }}
          selectedFormats={EXPORT_FORMATS.filter(f => selectedFormats.has(f.format))}
          croppingStrategy={croppingStrategy}
          isOpen={!!previewClip}
          onClose={() => {
            setPreviewClip(null)
          }}
          onExport={(formats, options) => {
            // Handle single export from preview
            console.log('Export from preview:', formats, options)
          }}
        />
      )}
    </>
  )
}
