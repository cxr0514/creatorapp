'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Pause, RotateCcw, Download, Eye, Settings } from 'lucide-react'
import { ExportFormat } from '@/lib/video-export'
import { SmartCropAnalysis, ContentAnalysis, smartCroppingEngine } from '@/lib/smart-cropping-engine'

interface Clip {
  id: number
  title: string
  videoId: number
  startTime: number
  endTime: number
  aspectRatio: string
  video: {
    url: string
    publicId: string
    duration: number
  }
}

interface ExportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  clip: Clip
  selectedFormats: ExportFormat[]
  croppingStrategy: string
  onExport: (formats: ExportFormat[], options: ExportOptions) => void
}

interface ExportOptions {
  quality: 'auto' | 'good' | 'best'
  useSmartCropping: boolean
  croppingStrategy: string
  customCropSettings?: Record<string, unknown>
}

interface PreviewData {
  format: ExportFormat
  originalUrl: string
  previewUrl: string
  smartCropAnalysis?: SmartCropAnalysis
  contentAnalysis?: ContentAnalysis
  isLoading: boolean
}

export function ExportPreviewModal({
  isOpen,
  onClose,
  clip,
  selectedFormats,
  croppingStrategy,
  onExport
}: ExportPreviewModalProps) {
  const [previews, setPreviews] = useState<PreviewData[]>([])
  const [selectedPreview, setSelectedPreview] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    quality: 'auto',
    useSmartCropping: true,
    croppingStrategy
  })
  const [showAnalysis, setShowAnalysis] = useState(false)

  const generatePreviews = useCallback(async () => {
    const newPreviews: PreviewData[] = selectedFormats.map(format => ({
      format,
      originalUrl: clip.video.url,
      previewUrl: '',
      isLoading: true
    }))

    setPreviews(newPreviews)

    // Generate previews for each format
    for (let i = 0; i < newPreviews.length; i++) {
      const format = newPreviews[i].format
      
      try {
        // Analyze content for smart cropping
        const contentAnalysis = await smartCroppingEngine.analyzeContent()
        const smartCropAnalysis = await smartCroppingEngine.determineCroppingStrategy(
          clip.aspectRatio,
          format,
          contentAnalysis
        )

        // Generate preview URL with Cloudinary transformation
        const transformation = smartCroppingEngine.generateCloudinaryTransformation(
          smartCropAnalysis,
          format,
          clip.startTime,
          clip.endTime
        )

        const previewUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${transformation}/${clip.video.publicId}.mp4`

        setPreviews(prev => prev.map((p, index) => 
          index === i ? {
            ...p,
            previewUrl,
            smartCropAnalysis,
            contentAnalysis,
            isLoading: false
          } : p
        ))
      } catch (error) {
        console.error('Error generating preview:', error)
        setPreviews(prev => prev.map((p, index) => 
          index === i ? { ...p, isLoading: false } : p
        ))
      }
    }
  }, [selectedFormats, clip.video.url, clip.video.publicId, clip.aspectRatio, clip.startTime, clip.endTime])

  useEffect(() => {
    if (isOpen && selectedFormats.length > 0) {
      generatePreviews()
    }
  }, [isOpen, selectedFormats, croppingStrategy, generatePreviews])

  const handleExport = () => {
    onExport(selectedFormats, exportOptions)
    onClose()
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const resetPreview = () => {
    setIsPlaying(false)
  }

  const currentPreview = previews[selectedPreview]

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Export Preview: {clip.title}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Analysis
              </Button>
              <Button variant="outline" onClick={onClose}>
                ✕
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Format Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Export Formats ({selectedFormats.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {previews.map((preview, index) => (
                  <button
                    key={preview.format.format}
                    onClick={() => setSelectedPreview(index)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedPreview === index
                        ? 'bg-primary/10 border-primary/50 text-primary'
                        : 'bg-surface border-border hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{preview.format.displayName}</div>
                      {preview.isLoading ? (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {preview.format.width} × {preview.format.height}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {preview.format.platforms.join(', ')}
                    </div>
                    {preview.smartCropAnalysis && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {preview.smartCropAnalysis.strategy}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          Confidence: {Math.round(preview.smartCropAnalysis.confidence * 100)}%
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Quality</label>
                  <select
                    value={exportOptions.quality}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      quality: e.target.value as 'auto' | 'good' | 'best'
                    }))}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="auto">Auto (Optimized)</option>
                    <option value="good">Good (Balanced)</option>
                    <option value="best">Best (High Quality)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="smartCropping"
                    checked={exportOptions.useSmartCropping}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      useSmartCropping: e.target.checked
                    }))}
                  />
                  <label htmlFor="smartCropping" className="text-sm">
                    Use Smart Cropping
                  </label>
                </div>

                {currentPreview?.smartCropAnalysis && (
                  <div className="text-xs text-foreground p-2 bg-primary/10 border border-primary/20 rounded">
                    <strong>Strategy:</strong> {currentPreview.smartCropAnalysis.strategy}<br />
                    <strong>Reasoning:</strong> {currentPreview.smartCropAnalysis.reasoning}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Preview Comparison
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetPreview}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={togglePlayback}>
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentPreview ? (
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Cropped Preview</TabsTrigger>
                      <TabsTrigger value="original">Original</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="mt-4">
                      <div className="relative">
                        {currentPreview.isLoading ? (
                          <div className="aspect-video bg-surface border border-border rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              <div className="text-sm text-muted-foreground">Generating preview...</div>
                            </div>
                          </div>
                        ) : currentPreview.previewUrl ? (
                          <video
                            key={currentPreview.previewUrl}
                            className="w-full rounded-lg shadow-lg"
                            style={{
                              aspectRatio: currentPreview.format.aspectRatio,
                              maxHeight: '400px',
                              objectFit: 'contain'
                            }}
                            controls
                          >
                            <source src={currentPreview.previewUrl} type="video/mp4" />
                          </video>
                        ) : (
                          <div className="aspect-video bg-surface border border-border rounded-lg flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              Preview not available
                            </div>
                          </div>
                        )}

                        {/* Format overlay */}
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-black/75 text-white">
                            {currentPreview.format.displayName}
                          </Badge>
                        </div>

                        {/* Dimensions overlay */}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">
                            {currentPreview.format.width} × {currentPreview.format.height}
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="original" className="mt-4">
                      <div className="relative">
                        <video
                          className="w-full rounded-lg shadow-lg"
                          style={{
                            aspectRatio: clip.aspectRatio,
                            maxHeight: '400px',
                            objectFit: 'contain'
                          }}
                          controls
                        >
                          <source src={clip.video.url} type="video/mp4" />
                        </video>

                        <div className="absolute top-2 left-2">
                          <Badge className="bg-black/75 text-white">
                            Original ({clip.aspectRatio})
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="aspect-video bg-surface border border-border rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      Select a format to preview
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Cropping Analysis */}
            {showAnalysis && currentPreview?.contentAnalysis && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Smart Cropping Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Face Detection</h4>
                      <p className="text-muted-foreground">
                        Detected: {currentPreview.contentAnalysis.faceDetection.detected ? 'Yes' : 'No'}
                      </p>
                      {currentPreview.contentAnalysis.faceDetection.detected && (
                        <p className="text-muted-foreground">
                          Count: {currentPreview.contentAnalysis.faceDetection.count}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Motion Analysis</h4>
                      <p className="text-muted-foreground">
                        Significant Motion: {currentPreview.contentAnalysis.motionAnalysis.hasSignificantMotion ? 'Yes' : 'No'}
                      </p>
                      <p className="text-muted-foreground">
                        Direction: {currentPreview.contentAnalysis.motionAnalysis.dominantDirection}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Scene Analysis</h4>
                      <p className="text-muted-foreground">
                        Brightness: {Math.round(currentPreview.contentAnalysis.sceneAnalysis.brightness * 100)}%
                      </p>
                      <p className="text-muted-foreground">
                        Composition: {currentPreview.contentAnalysis.sceneAnalysis.composition.type}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Object Detection</h4>
                      <p className="text-muted-foreground">
                        Objects: {currentPreview.contentAnalysis.objectDetection.objects.length}
                      </p>
                      {currentPreview.contentAnalysis.objectDetection.mainSubject && (
                        <p className="text-muted-foreground">
                          Main Subject: {currentPreview.contentAnalysis.objectDetection.mainSubject.label}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentPreview.smartCropAnalysis && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <h4 className="font-medium text-primary mb-2">Recommended Strategy</h4>
                      <p className="text-primary/80 text-sm">
                        {currentPreview.smartCropAnalysis.reasoning}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-primary border-primary/30">
                          {currentPreview.smartCropAnalysis.strategy} - {Math.round(currentPreview.smartCropAnalysis.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedFormats.length} format{selectedFormats.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export All Formats
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
