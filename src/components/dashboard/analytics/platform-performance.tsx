/**
 * PlatformPerformance Component
 * Displays analytics data for each social media platform
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Eye, Heart, Share2, Clock, Globe, Play, Music, Camera, MessageCircle, Briefcase } from '@/lib/icons'
import type { PlatformMetrics } from '@/lib/types/analytics'
import { formatNumber } from '@/lib/utils/analytics'
import { PLATFORMS } from '@/lib/analytics-constants'

const PlatformIcons = {
  Globe,
  Play,
  Music,
  Camera,
  MessageCircle,
  Briefcase
} as const

interface PlatformPerformanceProps {
  platforms: PlatformMetrics[]
  isLoading?: boolean
}

interface PlatformCardProps {
  platform: PlatformMetrics
}

function PlatformCard({ platform }: PlatformCardProps) {
  const platformConfig = PLATFORMS.find(p => p.value === platform.platform)
  const platformName = platformConfig?.label || platform.platform
  const platformIconName = platformConfig?.icon || 'Globe'
  const PlatformIcon = PlatformIcons[platformIconName as keyof typeof PlatformIcons] || Globe
  const iconColorClass = platformConfig?.colorClass || 'text-gray-600'

  const metrics = [
    { label: 'Views', value: platform.views, icon: Eye, color: 'text-blue-600' },
    { label: 'Engagement', value: platform.engagement, icon: Heart, color: 'text-pink-600' },
    { label: 'Shares', value: platform.shares, icon: Share2, color: 'text-green-600' },
    { label: 'Followers', value: platform.followers, icon: Users, color: 'text-purple-600' }
  ]

  const watchTimeDisplay = `${Math.floor(platform.avgWatchTime / 60)}:${(platform.avgWatchTime % 60).toString().padStart(2, '0')}`

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`text-2xl ${iconColorClass}`}>
              <PlatformIcon size={28} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold capitalize">
                {platformName}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Social Media Platform
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {formatNumber(platform.views)} views
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <Icon className={`h-4 w-4 ${metric.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">{metric.label}</p>
                  <p className="text-sm font-semibold">{formatNumber(metric.value)}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-gray-600">Avg Watch Time</span>
          </div>
          <span className="text-sm font-semibold text-orange-600">
            {watchTimeDisplay}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonPlatformCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-1">
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded-lg">
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

export function PlatformPerformance({ platforms, isLoading = false }: PlatformPerformanceProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Platform Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonPlatformCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Platform Performance</h2>
        <div className="text-sm text-gray-500">
          {platforms.length} platform{platforms.length !== 1 ? 's' : ''} tracked
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform, index) => (
          <PlatformCard key={index} platform={platform} />
        ))}
      </div>
    </div>
  )
}
