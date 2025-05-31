/**
 * Refactored Analytics Dashboard
 * Modular dashboard using specialized components with improved code organization
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Download, 
  Filter, 
  Calendar,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Globe, 
  Play, 
  Music, 
  Camera, 
  MessageCircle, 
  Briefcase 
} from 'lucide-react'

// Import our new modular components
import { MetricsOverview } from './analytics/metrics-overview'
import { PlatformPerformance } from './analytics/platform-performance'
import { TopContent } from './analytics/top-content'
import { AIRecommendations } from './analytics/ai-recommendations'
import { AudienceInsights } from './analytics/audience-insights'

// Import hooks and utilities
import { useAnalyticsData, useDashboardFilters, useDataExport } from '@/lib/hooks/use-analytics'
import { PLATFORMS, TIME_RANGES } from '@/lib/analytics-constants'

// Icon mapping for platforms
const PlatformIcons = {
  Globe,
  Play,
  Music,
  Camera,
  MessageCircle,
  Briefcase
} as const

interface AnalyticsDashboardProps {
  className?: string
}

function FilterBar() {
  const { timeRange, platform, setTimeRange, setPlatform } = useDashboardFilters()
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Period:</span>
              <div className="flex space-x-1">
                {TIME_RANGES.map((range) => (
                  <Button
                    key={range.value}
                    variant={timeRange === range.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range.value)}
                    className="text-xs"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Platform Selector */}
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Platform:</span>
              <div className="flex flex-wrap gap-1">
                {PLATFORMS.map((p) => {
                  const IconComponent = PlatformIcons[p.icon as keyof typeof PlatformIcons] || Globe
                  return (
                    <Button
                      key={p.value}
                      variant={platform === p.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlatform(p.value)}
                      className="text-xs"
                    >
                      <IconComponent className={`mr-1 h-3 w-3 ${p.colorClass}`} />
                      {p.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardHeader({ 
  onRefresh, 
  onExport, 
  isLoading, 
  isExporting 
}: {
  onRefresh: () => void
  onExport: () => void
  isLoading: boolean
  isExporting: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <span>Analytics Dashboard</span>
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Track your content performance across all platforms
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        </Button>
      </div>
    </div>
  )
}

function ErrorCard({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Error Loading Analytics
        </h3>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <Button onClick={onRetry} size="sm" variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { timeRange, platform } = useDashboardFilters()
  const { data, loading, error, refetch } = useAnalyticsData(timeRange, platform)
  const { exportData, exporting } = useDataExport()

  const handleExport = async () => {
    if (data) {
      await exportData(data, platform, timeRange)
    }
  }

  const handleContentDetails = (contentId: string) => {
    console.log('Viewing content details:', contentId)
    // In production, this would navigate to content details page
  }

  const handleApplyRecommendation = (recommendationId: string) => {
    console.log('Applying recommendation:', recommendationId)
    // In production, this would apply the AI recommendation
  }

  const handleDismissRecommendation = (recommendationId: string) => {
    console.log('Dismissing recommendation:', recommendationId)
    // In production, this would dismiss the recommendation
  }

  if (error) {
    return (
      <div className={className}>
        <DashboardHeader 
          onRefresh={refetch}
          onExport={handleExport}
          isLoading={loading}
          isExporting={exporting}
        />
        <ErrorCard error={error.message} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className={className}>
      <DashboardHeader 
        onRefresh={refetch}
        onExport={handleExport}
        isLoading={loading}
        isExporting={exporting}
      />
      
      <FilterBar />
      
      <div className="space-y-8">
        {/* Overview Metrics */}
        <MetricsOverview 
          metrics={data?.overview || {
            totalViews: 0,
            totalEngagement: 0, 
            totalShares: 0,
            avgWatchTime: 0,
            viewsChange: 0,
            engagementChange: 0,
            sharesChange: 0,
            watchTimeChange: 0
          }}
          isLoading={loading}
        />

        {/* Platform Performance */}
        <PlatformPerformance 
          platforms={data?.platforms || []}
          isLoading={loading}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Top Content */}
          <TopContent 
            content={data?.topContent || []}
            isLoading={loading}
            onViewDetails={handleContentDetails}
          />

          {/* AI Recommendations */}
          <AIRecommendations 
            recommendations={data?.aiRecommendations || []}
            isLoading={loading}
            onApplyRecommendation={handleApplyRecommendation}
            onDismissRecommendation={handleDismissRecommendation}
          />
        </div>

        {/* Audience Insights */}
        <AudienceInsights 
          insights={data?.audienceInsights || {
            demographics: [],
            topLocations: [],
            deviceBreakdown: []
          }}
          isLoading={loading}
        />
      </div>

      {/* Status Footer */}
      {data && (
        <div className="mt-8 text-center">
          <Badge variant="secondary" className="text-xs">
            Data refreshed at {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      )}
    </div>
  )
}
