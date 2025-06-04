'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlatformIcon, PlatformBadge } from '@/lib/platform-icons'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface PlatformAnalytics {
  platform: string
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalShares: number
  totalComments: number
  engagementRate: number
  averageViews: number
  bestPerformingPost: {
    id: string
    title: string
    views: number
    engagement: number
    publishedAt: Date
  }
  growthRate: number // percentage change from previous period
  optimalPostTimes: string[]
}

interface TimeSeriesData {
  date: string
  views: number
  likes: number
  shares: number
  comments: number
  engagement: number
}

interface ContentPerformance {
  id: string
  title: string
  platform: string
  views: number
  likes: number
  shares: number
  comments: number
  engagementRate: number
  publishedAt: Date
  thumbnailUrl?: string
}

export function SocialMediaAnalytics() {
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [topContent, setTopContent] = useState<ContentPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'platforms' | 'content'>('overview')

  useEffect(() => {
    loadAnalytics()
  }, [selectedPlatform, timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [analyticsRes, timeSeriesRes, contentRes] = await Promise.all([
        fetch(`/api/analytics/platforms?platform=${selectedPlatform}&timeRange=${timeRange}`),
        fetch(`/api/analytics/time-series?platform=${selectedPlatform}&timeRange=${timeRange}`),
        fetch(`/api/analytics/content?platform=${selectedPlatform}&timeRange=${timeRange}&limit=10`)
      ])
      
      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setPlatformAnalytics(data.platforms || [])
      }
      
      if (timeSeriesRes.ok) {
        const data = await timeSeriesRes.json()
        setTimeSeriesData(data.timeSeries || [])
      }
      
      if (contentRes.ok) {
        const data = await contentRes.json()
        setTopContent(data.content || [])
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalMetrics = () => {
    return platformAnalytics.reduce((acc, platform) => ({
      totalViews: acc.totalViews + platform.totalViews,
      totalLikes: acc.totalLikes + platform.totalLikes,
      totalShares: acc.totalShares + platform.totalShares,
      totalComments: acc.totalComments + platform.totalComments,
      totalPosts: acc.totalPosts + platform.totalPosts,
      avgEngagement: acc.avgEngagement + platform.engagementRate
    }), {
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalComments: 0,
      totalPosts: 0,
      avgEngagement: 0
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const exportData = async () => {
    try {
      const response = await fetch(`/api/analytics/export?platform=${selectedPlatform}&timeRange=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${selectedPlatform}-${timeRange}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const totalMetrics = getTotalMetrics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Analytics</h2>
          <p className="text-gray-600 mt-1">Track your content performance across all platforms</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Platforms</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          
          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalMetrics.totalViews)}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Engagement</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalMetrics.totalLikes + totalMetrics.totalShares + totalMetrics.totalComments)}
              </p>
            </div>
            <Heart className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{totalMetrics.totalPosts}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalMetrics.avgEngagement > 0 ? (totalMetrics.avgEngagement / platformAnalytics.length).toFixed(1) : '0'}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('platforms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'platforms'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Platform Breakdown
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Top Content
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Time Series Chart Placeholder */}
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Over Time</h3>
                <p className="text-gray-600">Chart visualization would be implemented here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Data points: {timeSeriesData.length} • Range: {timeRange}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'platforms' && (
            <div className="space-y-4">
              {platformAnalytics.map((platform) => (
                <div key={platform.platform} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platformId={platform.platform} size="md" />
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">{platform.platform}</h3>
                        <p className="text-sm text-gray-600">{platform.totalPosts} posts</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getGrowthIcon(platform.growthRate)}
                      <span className={`text-sm font-medium ${getGrowthColor(platform.growthRate)}`}>
                        {platform.growthRate > 0 ? '+' : ''}{platform.growthRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Views</p>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(platform.totalViews)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Likes</p>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(platform.totalLikes)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Shares</p>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(platform.totalShares)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Comments</p>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(platform.totalComments)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Engagement Rate</p>
                      <p className="text-lg font-semibold text-gray-900">{platform.engagementRate.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {platform.bestPerformingPost && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Best Performing Post:</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">{platform.bestPerformingPost.title}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatNumber(platform.bestPerformingPost.views)} views</span>
                          <span>{platform.bestPerformingPost.engagement.toFixed(1)}% engagement</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Content</h3>
                <p className="text-sm text-gray-600">Last {timeRange}</p>
              </div>
              
              {topContent.map((content, index) => (
                <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">#{index + 1}</span>
                      </div>
                    </div>
                    
                    {content.thumbnailUrl && (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={content.thumbnailUrl} 
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">{content.title}</h4>
                        <PlatformBadge platformId={content.platform} size="sm" />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-gray-400" />
                          <span>{formatNumber(content.views)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-gray-400" />
                          <span>{formatNumber(content.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-3 h-3 text-gray-400" />
                          <span>{formatNumber(content.shares)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-gray-400" />
                          <span>{formatNumber(content.comments)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-purple-600">{content.engagementRate.toFixed(1)}%</span>
                          <span className="text-gray-500 ml-1">engagement</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Published {new Date(content.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
