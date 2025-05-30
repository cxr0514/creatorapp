'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { EXPORT_FORMATS, getPlatformRecommendations } from '@/lib/video-export'

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
  const [isExporting, setIsExporting] = useState(false)
  const [exportResults, setExportResults] = useState<ExportResult[]>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedFormats({})
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
          formats: exports
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

            <div className="grid gap-6">
              {EXPORT_FORMATS.map((format) => (
                <div key={format.format} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {format.displayName}
                        {isCurrentFormat(format.format) && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{format.description}</p>
                      <p className="text-xs text-gray-500">
                        Resolution: {format.width} × {format.height}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {selectedFormats[format.format]?.size || 0} selected
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {format.platforms.map((platform) => {
                      const isSelected = selectedFormats[format.format]?.has(platform) || false
                      const recommendations = getPlatformRecommendations(format)
                      const platformRec = recommendations.find(rec => rec.startsWith(platform))
                      
                      return (
                        <button
                          key={platform}
                          onClick={() => togglePlatform(format.format, platform)}
                          className={`p-3 rounded-lg border text-sm transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="font-medium capitalize">
                            {platform.replace('-', ' ')}
                          </div>
                          {platformRec && (
                            <div className="text-xs text-gray-500 mt-1">
                              {platformRec.split('(')[1]?.replace(')', '') || ''}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || getSelectedExports().length === 0}
              >
                {isExporting ? 'Exporting...' : `Export ${getSelectedExports().length} Format${getSelectedExports().length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Export Results</h3>
              <p className="text-sm text-gray-600">
                Your exports have been processed. You can download them or view them in your clips list.
              </p>
            </div>

            <div className="space-y-3">
              {exportResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {result.format} for {result.platform.replace('-', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.estimatedProcessingTime && (
                        <p className="text-xs text-gray-500">
                          Processing time: ~{result.estimatedProcessingTime}s
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'created' 
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'exists'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'created' ? 'New' : result.status === 'exists' ? 'Existing' : 'Error'}
                      </span>
                      {result.url && (
                        <Button 
                          size="sm" 
                          onClick={() => window.open(result.url, '_blank')}
                        >
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Export More
              </Button>
              <Button onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
