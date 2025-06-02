'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  EXPORT_FORMATS, 
  CROPPING_STRATEGIES, 
  getPlatformRecommendations,
  type ExportFormat,
  type CroppingStrategyInfo,
  getRecommendedCroppingStrategy,
  getCroppingStrategyInfo 
} from '@/lib/video-export'

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

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedFormats({})
      setCroppingStrategy('smart')
      setShowAdvanced(false)
      setExportResults([])
      setShowResults(false)
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
          croppingStrategy
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Export Clip: {clip.title}</h2>
            <p className="text-sm text-gray-500">
              Current format: {clip.aspectRatio} • Duration: {getDuration()}s
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </div>

        {!showResults ? (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Select Export Formats & Platforms</h3>
              <p className="text-sm text-gray-600">
                Choose the formats and platforms you want to export to. Smart cropping will be applied automatically.
              </p>
            </div>

            {/* Advanced Cropping Options */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
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
                    <p className="text-sm text-gray-600">
                      {getCroppingStrategyInfo(croppingStrategy)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {showAdvanced && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <h5 className="font-medium mb-2">Best For:</h5>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {getCroppingStrategyInfo(croppingStrategy)?.bestFor.map((use: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
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
                          <div key={format.format} className={`p-2 rounded ${isOptimal ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
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

            {/* Format Selection */}
            <div className="space-y-4">
              {EXPORT_FORMATS.map((format) => (
                <div key={format.format} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{format.displayName}</h4>
                      <p className="text-sm text-gray-600">{format.description}</p>
                    </div>
                    {isCurrentFormat(format.format) && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
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
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || getSelectedExports().length === 0}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
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
