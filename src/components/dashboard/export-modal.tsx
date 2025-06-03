'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  EXPORT_FORMATS, 
  CROPPING_STRATEGIES, 
  type ExportFormat,
  type CroppingStrategyInfo,
  getRecommendedCroppingStrategy,
  getCroppingStrategyInfo 
} from '@/lib/video-export'
import { TemplateList } from '@/components/video/template-list'
import { TemplatePreview } from '@/components/video/template-preview'
import { StyleTemplate } from '@/lib/hooks/use-templates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Clip {
  id: number
  title: string
  aspectRatio?: string
  startTime?: number
  endTime?: number
}

interface ExportModalProps {
  clip: Clip
  isOpen: boolean
  onClose: () => void
  onExportComplete: () => void
}

interface ExportRequest {
  format: string
  platform: string
}

interface ExportResult {
  format: string
  platform: string
  status: 'created' | 'exists' | 'error'
  url?: string
  thumbnailUrl?: string
  estimatedProcessingTime?: number
  message?: string
}

export function ExportModal({ clip, isOpen, onClose, onExportComplete }: ExportModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<{ [key: string]: Set<string> }>({})
  const [croppingStrategy, setCroppingStrategy] = useState<string>('smart')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResults, setExportResults] = useState<ExportResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedFormats({})
      setCroppingStrategy('smart')
      setShowAdvanced(false)
      setExportResults([])
      setShowResults(false)
      setSelectedTemplate(null)
    }
  }, [isOpen])

  const togglePlatform = (format: string, platform: string) => {
    setSelectedFormats(prev => {
      const formatSet = prev[format] || new Set()
      const newSet = new Set(formatSet)
      
      if (newSet.has(platform)) {
        newSet.delete(platform)
      } else {
        newSet.add(platform)
      }
      
      return {
        ...prev,
        [format]: newSet
      }
    })
  }

  const getSelectedExports = (): ExportRequest[] => {
    const exports: ExportRequest[] = []
    
    Object.entries(selectedFormats).forEach(([format, platforms]) => {
      platforms.forEach(platform => {
        exports.push({ format, platform })
      })
    })
    
    return exports
  }

  const handleExport = async () => {
    const exports = getSelectedExports()
    
    if (exports.length === 0) {
      alert('Please select at least one format and platform combination')
      return
    }

    setIsExporting(true)
    
    try {
      const response = await fetch(`/api/clips/${clip.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clipId: clip.id,
          formats: exports,
          croppingStrategy,
          templateId: selectedTemplate?.id || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setExportResults(data.results || [])
        setShowResults(true)
        onExportComplete()
      } else {
        const error = await response.json()
        alert(`Export failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed due to a network error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleTemplateSelect = (template: StyleTemplate) => {
    setSelectedTemplate(template)
  }

  const isCurrentFormat = (format: string) => {
    return clip.aspectRatio === format
  }

  const getDuration = () => {
    if (clip.startTime !== undefined && clip.endTime !== undefined) {
      return clip.endTime - clip.startTime
    }
    return 0
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Export Clip: {clip.title}</h2>
            <p className="text-sm text-muted-foreground">
              Current format: {clip.aspectRatio} • Duration: {getDuration()}s
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </div>

        {!showResults ? (
          <Tabs defaultValue="formats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="formats">Export Formats</TabsTrigger>
              <TabsTrigger value="templates">Style Templates</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="formats" className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Select Export Formats & Platforms</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the formats and platforms you want to export to. Smart cropping will be applied automatically.
                </p>
              </div>

              {/* Advanced Cropping Options */}
              <div className="mb-6 border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Smart Cropping Options</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cropping Strategy</label>
                    <select
                      value={croppingStrategy}
                      onChange={(e) => setCroppingStrategy(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      {CROPPING_STRATEGIES.map((strategy: CroppingStrategyInfo) => (
                        <option key={strategy.type} value={strategy.type}>
                          {strategy.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {getCroppingStrategyInfo(croppingStrategy)?.description}
                      </p>
                    </div>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      <h5 className="font-medium mb-2">Best For:</h5>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {getCroppingStrategyInfo(croppingStrategy)?.bestFor.map((use: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            {use}
                          </span>
                        ))}
                      </div>
                      
                      <h5 className="font-medium mb-2">Recommendations by Format:</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {EXPORT_FORMATS.map((format: ExportFormat) => {
                          const recommended = getRecommendedCroppingStrategy('general', format, true)
                          const isOptimal = recommended === croppingStrategy
                          return (
                            <div key={format.format} className={`p-2 rounded ${isOptimal ? 'bg-green-500/10 text-green-400' : 'bg-muted'}`}>
                              <span className="font-medium">{format.displayName}:</span> {recommended}
                              {isOptimal && <span className="ml-1">✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Format Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {EXPORT_FORMATS.map((format) => (
                  <div key={format.format} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{format.displayName}</h4>
                        <p className="text-sm text-muted-foreground">{format.description}</p>
                      </div>
                      {isCurrentFormat(format.format) && (
                        <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">
                          Current Format
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                      {format.platforms.map((platform) => (
                        <button
                          key={platform}
                          onClick={() => togglePlatform(format.format, platform)}
                          className={`p-2 text-sm rounded-md border ${
                            selectedFormats[format.format]?.has(platform)
                              ? 'bg-primary/10 border-primary/50 text-primary'
                              : 'bg-surface border border-border border-border text-foreground hover:bg-muted/20'
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Choose a Style Template</h3>
                <p className="text-sm text-muted-foreground">
                  Apply consistent branding and styling to your exported videos.
                </p>
              </div>

              {selectedTemplate && (
                <div className="mb-4 p-4 bg-primary/10 border border-primary/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-primary">Selected Template: {selectedTemplate.name}</h4>
                      <p className="text-sm text-primary">This template will be applied to all exported videos</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              <TemplateList
                onSelectTemplate={handleTemplateSelect}
                selectedTemplateId={selectedTemplate?.id}
                selectionMode={true}
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Export Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Preview how your clip will look with the selected template and formats.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Preview */}
                {selectedTemplate ? (
                  <div>
                    <h4 className="font-medium mb-3">Template Preview</h4>
                    <TemplatePreview 
                      template={selectedTemplate}
                      aspectRatio={Object.keys(selectedFormats)[0] || '16:9'}
                    />
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                    <p className="text-muted-foreground mb-2">No template selected</p>
                    <p className="text-sm text-muted-foreground">Go to the Templates tab to choose a style template</p>
                  </div>
                )}

                {/* Export Summary */}
                <div>
                  <h4 className="font-medium mb-3">Export Summary</h4>
                  <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Clip:</span>
                      <span className="text-sm font-medium">{clip.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <span className="text-sm font-medium">{getDuration()}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Template:</span>
                      <span className="text-sm font-medium">
                        {selectedTemplate?.name || 'No template'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Formats:</span>
                      <span className="text-sm font-medium">
                        {getSelectedExports().length} selected
                      </span>
                    </div>
                    
                    {getSelectedExports().length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Selected exports:</p>
                        <div className="space-y-1">
                          {getSelectedExports().map((exp, idx) => (
                            <div key={idx} className="text-xs bg-surface border border-border px-2 py-1 rounded">
                              {exp.format} → {exp.platform}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Export Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || getSelectedExports().length === 0}
                className="min-w-[120px]"
              >
                {isExporting ? 'Exporting...' : `Export ${getSelectedExports().length} Format${getSelectedExports().length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Export Results</h3>
            <div className="space-y-2">
              {exportResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md ${
                    result.status === 'error'
                      ? 'bg-red-50 text-red-700'
                      : result.status === 'exists'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {result.format} - {result.platform}
                      </p>
                      <p className="text-sm">{result.message}</p>
                    </div>
                    {result.status === 'created' && result.estimatedProcessingTime && (
                      <p className="text-sm">
                        Est. time: {result.estimatedProcessingTime}s
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
