/**
 * TopContent Component
 * Displays top performing content with engagement metrics
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Heart, Calendar, ExternalLink, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import type { TopPerformingContent } from '@/lib/types/analytics'
import { formatNumber } from '@/lib/utils/analytics'
import { PLATFORMS } from '@/lib/analytics-constants'

interface TopContentProps {
  content: TopPerformingContent[]
  isLoading?: boolean
  onViewDetails?: (contentId: string) => void
}

interface ContentItemProps {
  content: TopPerformingContent
  onViewDetails?: (contentId: string) => void
}

function ContentItem({ content, onViewDetails }: ContentItemProps) {
  const platformConfig = PLATFORMS.find(p => p.value === content.platform)
  const platformIcon = platformConfig?.icon || '📱'
  const platformName = platformConfig?.label || content.platform

  const publishDate = new Date(content.publishDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  const engagementRate = content.views > 0 ? ((content.engagement / content.views) * 100).toFixed(1) : '0'

  return (
    <Card className="transition-all duration-200 hover:shadow-md group">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden">
              {content.thumbnailUrl ? (
                <Image 
                  src={content.thumbnailUrl} 
                  alt={content.title}
                  width={64}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                  <span className="text-xs text-gray-600">📹</span>
                </div>
              )}
            </div>
          </div>

          {/* Content Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {content.title}
              </h3>
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  onClick={() => onViewDetails(content.id)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Platform and Date */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex items-center space-x-1">
                <span className="text-sm">{platformIcon}</span>
                <span className="text-xs text-gray-600 capitalize">{platformName}</span>
              </div>
              <span className="text-xs text-gray-400">•</span>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{publishDate}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-900">
                    {formatNumber(content.views)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3 text-pink-600" />
                  <span className="text-xs font-medium text-gray-900">
                    {formatNumber(content.engagement)}
                  </span>
                </div>
              </div>
              
              <Badge 
                variant={parseFloat(engagementRate) > 5 ? "default" : "secondary"}
                className="text-xs"
              >
                <TrendingUp className="h-2 w-2 mr-1" />
                {engagementRate}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonContentItem() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-12 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TopContent({ content, isLoading = false, onViewDetails }: TopContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Top Performing Content</h2>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonContentItem key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (content.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-sm text-gray-600">No content data available</p>
          <p className="text-xs text-gray-500 mt-1">
            Create and publish content to see performance metrics
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Top Performing Content</h2>
        <div className="text-sm text-gray-500">
          Showing {content.length} item{content.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="space-y-4">
        {content.map((item) => (
          <ContentItem 
            key={item.id} 
            content={item} 
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  )
}
