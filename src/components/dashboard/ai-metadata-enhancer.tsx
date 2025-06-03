// AI-powered metadata enhancement component
'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AIMetadataEnhancerProps {
  initialTitle?: string
  initialDescription?: string
  initialHashtags?: string[]
  onMetadataUpdate?: (metadata: {
    title?: string
    description?: string
    hashtags?: string[]
    categories?: string[]
    keywords?: string[]
  }) => void
  className?: string
}

interface AIOptions {
  contentType: 'educational' | 'entertainment' | 'business' | 'lifestyle' | 'tech' | 'other'
  targetAudience: 'general' | 'professional' | 'youth' | 'creators' | 'specific'
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin' | 'all'
}

interface GeneratedMetadata {
  titles?: string[]
  description?: string
  hashtags?: string[]
  categories?: string[]
  keywords?: string[]
}

export function AIMetadataEnhancer({
  initialTitle = '',
  initialDescription = '',
  initialHashtags = [],
  onMetadataUpdate,
  className = ''
}: AIMetadataEnhancerProps) {
  const { toast } = useToast()
  
  // Form state
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags)
  
  // AI options
  const [aiOptions, setAiOptions] = useState<AIOptions>({
    contentType: 'other',
    targetAudience: 'general',
    platform: 'all'
  })
  
  // AI generated data
  const [generatedMetadata, setGeneratedMetadata] = useState<GeneratedMetadata>({})
  
  // Loading states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState<string | null>(null)
  
  // UI state
  const [showPreview, setShowPreview] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Generate AI metadata
  const generateMetadata = useCallback(async (type: string) => {
    if (!title && !description) {
      toast({
        title: 'Missing Information',
        description: 'Please provide either a title or description to generate AI metadata.',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    setGeneratingType(type)

    try {
      const response = await fetch('/api/ai/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          videoTitle: title,
          videoDescription: description,
          options: aiOptions
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate metadata')
      }

      // Update generated metadata
      setGeneratedMetadata(prev => ({
        ...prev,
        [type === 'title' ? 'titles' : type]: result.data
      }))

      toast({
        title: 'AI Generation Complete',
        description: `Generated ${type} successfully!`,
      })
    } catch (error) {
      console.error('AI generation error:', error)
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
      setGeneratingType(null)
    }
  }, [title, description, aiOptions, toast])

  // Generate complete metadata
  const generateCompleteMetadata = useCallback(async () => {
    if (!title) {
      toast({
        title: 'Missing Title',
        description: 'Please provide a title to generate complete metadata.',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    setGeneratingType('complete')

    try {
      const response = await fetch('/api/ai/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'complete',
          videoTitle: title,
          videoDescription: description,
          options: aiOptions
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate complete metadata')
      }

      const metadata = result.data
      setGeneratedMetadata({
        titles: [metadata.title],
        description: metadata.description,
        hashtags: metadata.hashtags,
        categories: metadata.categories,
        keywords: metadata.keywords
      })

      toast({
        title: 'Complete Metadata Generated',
        description: 'All metadata has been generated successfully!',
      })
    } catch (error) {
      console.error('Complete generation error:', error)
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
      setGeneratingType(null)
    }
  }, [title, description, aiOptions, toast])

  // Apply generated metadata
  const applyMetadata = useCallback((field: string, value: string | string[]) => {
    switch (field) {
      case 'title':
        setTitle(value as string)
        break
      case 'description':
        setDescription(value as string)
        break
      case 'hashtags':
        setHashtags(value as string[])
        break
    }

    // Notify parent component
    onMetadataUpdate?.({
      title: field === 'title' ? (value as string) : title,
      description: field === 'description' ? (value as string) : description,
      hashtags: field === 'hashtags' ? (value as string[]) : hashtags,
      categories: generatedMetadata.categories,
      keywords: generatedMetadata.keywords
    })

    toast({
      title: 'Metadata Applied',
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated.`,
    })
  }, [title, description, hashtags, generatedMetadata, onMetadataUpdate, toast])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      
      toast({
        title: 'Copied to Clipboard',
        description: `${field} copied successfully!`,
      })
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive'
      })
    }
  }, [toast])

  const isLoading = (type: string) => isGenerating && generatingType === type

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          AI Metadata Enhancer
        </CardTitle>
        <CardDescription>
          Use AI to generate engaging titles, descriptions, hashtags, and more for your content.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* AI Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 gap-y-8">
          <div className="relative">
            <label className="text-sm font-medium mb-2 block">Content Type</label>
            <Select 
              value={aiOptions.contentType} 
              onValueChange={(value) => setAiOptions(prev => ({ ...prev, contentType: value as AIOptions['contentType'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <label className="text-sm font-medium mb-2 block">Target Audience</label>
            <Select 
              value={aiOptions.targetAudience} 
              onValueChange={(value) => setAiOptions(prev => ({ ...prev, targetAudience: value as AIOptions['targetAudience'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="youth">Youth</SelectItem>
                <SelectItem value="creators">Content Creators</SelectItem>
                <SelectItem value="specific">Niche/Specific</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <label className="text-sm font-medium mb-2 block">Platform</label>
            <Select 
              value={aiOptions.platform} 
              onValueChange={(value) => setAiOptions(prev => ({ ...prev, platform: value as AIOptions['platform'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50">
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

        {/* Current Content */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Current Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your video title..."
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Current Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter your video description..."
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Current Hashtags</label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
              {hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {hashtags.length === 0 && (
                <span className="text-gray-500 text-sm">No hashtags yet...</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={generateCompleteMetadata}
            disabled={isGenerating || !title}
            className="flex items-center gap-2"
          >
            {isLoading('complete') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Complete Metadata
          </Button>
          
          <Button
            variant="outline"
            onClick={() => generateMetadata('title')}
            disabled={isGenerating || !description}
          >
            {isLoading('title') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Generate Titles
          </Button>
          
          <Button
            variant="outline"
            onClick={() => generateMetadata('description')}
            disabled={isGenerating || !title}
          >
            {isLoading('description') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Generate Description
          </Button>
          
          <Button
            variant="outline"
            onClick={() => generateMetadata('hashtags')}
            disabled={isGenerating || !title}
          >
            {isLoading('hashtags') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Generate Hashtags
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="ml-auto"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
        </div>

        {/* Generated Metadata Display */}
        {Object.keys(generatedMetadata).length > 0 && (
          <Tabs defaultValue="titles" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="titles" disabled={!generatedMetadata.titles}>
                Titles ({generatedMetadata.titles?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="description" disabled={!generatedMetadata.description}>
                Description
              </TabsTrigger>
              <TabsTrigger value="hashtags" disabled={!generatedMetadata.hashtags}>
                Hashtags ({generatedMetadata.hashtags?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="analysis" disabled={!generatedMetadata.categories}>
                Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="titles" className="space-y-3">
              {generatedMetadata.titles?.map((generatedTitle, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{generatedTitle}</p>
                    <p className="text-sm text-gray-500">{generatedTitle.length} characters</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedTitle, `title-${index}`)}
                  >
                    {copiedField === `title-${index}` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyMetadata('title', generatedTitle)}
                  >
                    Use This
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="description" className="space-y-3">
              {generatedMetadata.description && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm text-gray-500">
                      {generatedMetadata.description.length} characters
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedMetadata.description!, 'description')}
                      >
                        {copiedField === 'description' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => generatedMetadata.description && applyMetadata('description', generatedMetadata.description)}
                        disabled={!generatedMetadata.description}
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{generatedMetadata.description}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="hashtags" className="space-y-3">
              {generatedMetadata.hashtags && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-sm text-gray-500">
                      {generatedMetadata.hashtags.length} hashtags
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(
                          generatedMetadata.hashtags!.map(tag => `#${tag}`).join(' '),
                          'hashtags'
                        )}
                      >
                        {copiedField === 'hashtags' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => generatedMetadata.hashtags && applyMetadata('hashtags', generatedMetadata.hashtags)}
                        disabled={!generatedMetadata.hashtags}
                      >
                        Use These
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedMetadata.hashtags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-3">
              {(generatedMetadata.categories || generatedMetadata.keywords) && (
                <div className="space-y-4">
                  {generatedMetadata.categories && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedMetadata.categories.map((category, index) => (
                          <Badge key={index} className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {generatedMetadata.keywords && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedMetadata.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Content Preview */}
        {showPreview && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Content Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-lg mb-1">{title || 'Your Video Title'}</h4>
                <p className="text-sm text-gray-600">{title.length} characters</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {description || 'Your video description will appear here...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
              </div>
              
              {hashtags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Hashtags:</p>
                  <div className="flex flex-wrap gap-1">
                    {hashtags.map((tag, index) => (
                      <span key={index} className="text-blue-600 text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
