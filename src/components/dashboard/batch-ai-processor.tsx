// Batch AI processing component for multiple videos/clips
'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, CheckCircle, XCircle, Clock, Play, Pause, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BatchItem {
  id: string
  type: 'video' | 'clip'
  title: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  generatedMetadata?: {
    title?: string
    titles?: string[]
    description?: string
    hashtags?: string[]
    categories?: string[]
    keywords?: string[]
  }
  error?: string
}

interface BatchAIProcessorProps {
  items: {
    id: string
    type: 'video' | 'clip'
    title: string
    description?: string
  }[]
  onComplete?: (results: { id: string; metadata: BatchItem['generatedMetadata']; error?: string }[]) => void
  className?: string
}

interface BatchOptions {
  generateTitles: boolean
  generateDescriptions: boolean
  generateHashtags: boolean
  generateCategories: boolean
  contentType: 'educational' | 'entertainment' | 'business' | 'lifestyle' | 'tech' | 'other'
  targetAudience: 'general' | 'professional' | 'youth' | 'creators' | 'specific'
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin' | 'all'
}

export function BatchAIProcessor({
  items,
  onComplete,
  className = ''
}: BatchAIProcessorProps) {
  const { toast } = useToast()
  
  const [batchItems, setBatchItems] = useState<BatchItem[]>(
    items.map(item => ({
      ...item,
      status: 'pending',
      progress: 0
    }))
  )
  
  const [batchOptions, setBatchOptions] = useState<BatchOptions>({
    generateTitles: true,
    generateDescriptions: true,
    generateHashtags: true,
    generateCategories: false,
    contentType: 'other',
    targetAudience: 'general',
    platform: 'all'
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>(items.map(item => item.id))

  // Calculate overall progress
  const overallProgress = batchItems.length > 0 
    ? (batchItems.reduce((sum, item) => sum + item.progress, 0) / batchItems.length)
    : 0

  const completedCount = batchItems.filter(item => item.status === 'completed').length
  const errorCount = batchItems.filter(item => item.status === 'error').length

  // Process a single item
  const processItem = useCallback(async (item: BatchItem): Promise<void> => {
    if (isPaused) return

    // Update status to processing
    setBatchItems(prev => prev.map(i => 
      i.id === item.id 
        ? { ...i, status: 'processing' as const, progress: 10 }
        : i
    ))

    try {
      const requests = []
      const results: Partial<BatchItem['generatedMetadata']> = {}

      // Generate titles if requested
      if (batchOptions.generateTitles && item.description) {
        requests.push(
          fetch('/api/ai/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'title',
              videoDescription: item.description,
              options: {
                contentType: batchOptions.contentType,
                targetAudience: batchOptions.targetAudience,
                platform: batchOptions.platform
              }
            })
          }).then(async res => {
            const data = await res.json()
            if (res.ok) results.titles = data.data
          })
        )
      }

      // Update progress
      setBatchItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, progress: 30 } : i
      ))

      // Generate descriptions if requested
      if (batchOptions.generateDescriptions && item.title) {
        requests.push(
          fetch('/api/ai/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'description',
              videoTitle: item.title,
              videoDescription: item.description || '',
              options: {
                contentType: batchOptions.contentType,
                targetAudience: batchOptions.targetAudience,
                platform: batchOptions.platform
              }
            })
          }).then(async res => {
            const data = await res.json()
            if (res.ok) results.description = data.data
          })
        )
      }

      // Update progress
      setBatchItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, progress: 50 } : i
      ))

      // Generate hashtags if requested
      if (batchOptions.generateHashtags && item.title) {
        requests.push(
          fetch('/api/ai/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'hashtags',
              videoTitle: item.title,
              videoDescription: item.description || '',
              options: {
                contentType: batchOptions.contentType,
                targetAudience: batchOptions.targetAudience,
                platform: batchOptions.platform
              }
            })
          }).then(async res => {
            const data = await res.json()
            if (res.ok) results.hashtags = data.data
          })
        )
      }

      // Update progress
      setBatchItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, progress: 70 } : i
      ))

      // Generate categories if requested
      if (batchOptions.generateCategories && item.title) {
        requests.push(
          fetch('/api/ai/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'categories',
              videoTitle: item.title,
              videoDescription: item.description || '',
              options: {
                contentType: batchOptions.contentType,
                targetAudience: batchOptions.targetAudience,
                platform: batchOptions.platform
              }
            })
          }).then(async res => {
            const data = await res.json()
            if (res.ok) {
              results.categories = data.data.categories
              results.keywords = data.data.keywords
            }
          })
        )
      }

      // Wait for all requests to complete
      await Promise.allSettled(requests)

      // Update progress to completion
      setBatchItems(prev => prev.map(i => 
        i.id === item.id 
          ? { 
              ...i, 
              status: 'completed' as const, 
              progress: 100,
              generatedMetadata: results
            }
          : i
      ))

    } catch (error) {
      console.error(`Error processing item ${item.id}:`, error)
      
      setBatchItems(prev => prev.map(i => 
        i.id === item.id 
          ? { 
              ...i, 
              status: 'error' as const, 
              progress: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : i
      ))
    }
  }, [batchOptions, isPaused])

  // Start batch processing
  const startBatchProcessing = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select at least one item to process.',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    setIsPaused(false)

    const itemsToProcess = batchItems.filter(item => 
      selectedItems.includes(item.id) && item.status !== 'completed'
    )

    try {
      for (let i = 0; i < itemsToProcess.length; i++) {
        if (isPaused) break
        
        await processItem(itemsToProcess[i])
        
        // Small delay between items to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Collect results
      const results = batchItems
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({
          id: item.id,
          metadata: item.generatedMetadata,
          error: item.error
        }))

      onComplete?.(results)

      toast({
        title: 'Batch Processing Complete',
        description: `Processed ${completedCount} items successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}.`,
      })

    } catch (error) {
      console.error('Batch processing error:', error)
      toast({
        title: 'Batch Processing Failed',
        description: 'An error occurred during batch processing.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [selectedItems, batchItems, isPaused, processItem, onComplete, completedCount, errorCount, toast])

  // Pause/Resume processing
  const togglePause = useCallback(() => {
    setIsPaused(!isPaused)
    toast({
      title: isPaused ? 'Processing Resumed' : 'Processing Paused',
      description: isPaused ? 'Batch processing has been resumed.' : 'Batch processing has been paused.',
    })
  }, [isPaused, toast])

  // Reset batch
  const resetBatch = useCallback(() => {
    setBatchItems(prev => prev.map(item => ({
      ...item,
      status: 'pending' as const,
      progress: 0,
      generatedMetadata: undefined,
      error: undefined
    })))
    setIsProcessing(false)
    setIsPaused(false)
    
    toast({
      title: 'Batch Reset',
      description: 'All items have been reset to pending status.',
    })
  }, [toast])

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }, [])

  // Select/Deselect all items
  const toggleSelectAll = useCallback(() => {
    setSelectedItems(prev => 
      prev.length === batchItems.length ? [] : batchItems.map(item => item.id)
    )
  }, [batchItems])

  const getStatusIcon = (status: BatchItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: BatchItem['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'processing': return 'text-blue-600'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <Card className={`w-full max-w-6xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Batch AI Processing
        </CardTitle>
        <CardDescription>
          Generate AI metadata for multiple videos and clips at once.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Batch Options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Processing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* What to Generate */}
            <div>
              <label className="text-sm font-medium mb-3 block">Generate:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="titles"
                    checked={batchOptions.generateTitles}
                    onCheckedChange={(checked) => 
                      setBatchOptions(prev => ({ ...prev, generateTitles: !!checked }))
                    }
                  />
                  <label htmlFor="titles" className="text-sm">Titles</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="descriptions"
                    checked={batchOptions.generateDescriptions}
                    onCheckedChange={(checked) => 
                      setBatchOptions(prev => ({ ...prev, generateDescriptions: !!checked }))
                    }
                  />
                  <label htmlFor="descriptions" className="text-sm">Descriptions</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hashtags"
                    checked={batchOptions.generateHashtags}
                    onCheckedChange={(checked) => 
                      setBatchOptions(prev => ({ ...prev, generateHashtags: !!checked }))
                    }
                  />
                  <label htmlFor="hashtags" className="text-sm">Hashtags</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="categories"
                    checked={batchOptions.generateCategories}
                    onCheckedChange={(checked) => 
                      setBatchOptions(prev => ({ ...prev, generateCategories: !!checked }))
                    }
                  />
                  <label htmlFor="categories" className="text-sm">Categories</label>
                </div>
              </div>
            </div>

            {/* AI Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content Type</label>
                <Select 
                  value={batchOptions.contentType} 
                  onValueChange={(value) => setBatchOptions(prev => ({ ...prev, contentType: value as BatchOptions['contentType'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <Select 
                  value={batchOptions.targetAudience} 
                  onValueChange={(value) => setBatchOptions(prev => ({ ...prev, targetAudience: value as BatchOptions['targetAudience'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                    <SelectItem value="creators">Content Creators</SelectItem>
                    <SelectItem value="specific">Niche/Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Platform</label>
                <Select 
                  value={batchOptions.platform} 
                  onValueChange={(value) => setBatchOptions(prev => ({ ...prev, platform: value as BatchOptions['platform'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Overall Progress</p>
                  <p className="text-xs text-muted-foreground">
                    {completedCount}/{selectedItems.length} completed
                    {errorCount > 0 && `, ${errorCount} errors`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
                </div>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={startBatchProcessing}
            disabled={isProcessing || selectedItems.length === 0}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Processing ({selectedItems.length} items)
          </Button>
          
          {isProcessing && (
            <Button
              variant="outline"
              onClick={togglePause}
              className="flex items-center gap-2"
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={resetBatch}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button
            variant="ghost"
            onClick={toggleSelectAll}
            disabled={isProcessing}
            className="ml-auto"
          >
            {selectedItems.length === batchItems.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {batchItems.map((item) => (
            <Card key={item.id} className={`transition-all ${
              selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                    disabled={isProcessing}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      <h4 className="font-medium truncate">{item.title}</h4>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                    )}
                    
                    {item.progress > 0 && (
                      <div className="mt-2">
                        <Progress value={item.progress} className="h-1" />
                      </div>
                    )}
                    
                    {item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {batchItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No items available for processing.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
