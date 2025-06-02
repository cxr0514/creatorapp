/**
 * MetricsOverview Component
 * Displays key analytics metrics with changes and visual indicators
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Eye, Heart, Share2, Clock } from '@/lib/icons'
import type { OverviewMetrics } from '@/lib/types/analytics'
import { formatNumber, formatPercentage, getChangeColor } from '@/lib/utils/analytics'

interface MetricsOverviewProps {
  metrics: OverviewMetrics
  isLoading?: boolean
}

interface MetricCardProps {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  formatter?: (value: number) => string
}

function MetricCard({ title, value, change, icon, formatter = formatNumber }: MetricCardProps) {
  const isPositive = change > 0
  const isNeutral = change === 0
  
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="p-2 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatter(value)}
        </div>
        <div className={`flex items-center text-sm ${getChangeColor(change)}`}>
          {!isNeutral && (isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />)}
          <span>
            {formatPercentage(change)} from last period
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

export function MetricsOverview({ metrics, isLoading = false }: MetricsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  const metricCards = [
    {
      title: 'Total Views',
      value: metrics.totalViews,
      change: metrics.viewsChange,
      icon: <Eye className="h-4 w-4 text-blue-600" />
    },
    {
      title: 'Engagement',
      value: metrics.totalEngagement,
      change: metrics.engagementChange,
      icon: <Heart className="h-4 w-4 text-pink-600" />
    },
    {
      title: 'Shares',
      value: metrics.totalShares,
      change: metrics.sharesChange,
      icon: <Share2 className="h-4 w-4 text-green-600" />
    },
    {
      title: 'Avg Watch Time',
      value: metrics.avgWatchTime,
      change: metrics.watchTimeChange,
      icon: <Clock className="h-4 w-4 text-orange-600" />,
      formatter: (value: number) => `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Overview Metrics</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
            formatter={metric.formatter}
          />
        ))}
      </div>
    </div>
  )
}
