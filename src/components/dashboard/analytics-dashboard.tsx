'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  overview: {
    totalViews: number
    totalEngagement: number
    totalShares: number
    avgWatchTime: number
    viewsChange: number
    engagementChange: number
    sharesChange: number
    watchTimeChange: number
  }
  platforms: {
    platform: string
    views: number
    engagement: number
    shares: number
    avgWatchTime: number
    followers: number
    icon: string
  }[]
  topPerforming: {
    id: string
    title: string
    platform: string
    views: number
    engagement: number
    publishDate: string
    thumbnailUrl?: string
  }[]
  audience: {
    demographics: {
      ageGroup: string
      percentage: number
    }[]
    locations: {
      country: string
      percentage: number
    }[]
    devices: {
      type: string
      percentage: number
    }[]
  }
  recommendations: {
    id: string
    type: 'length' | 'style' | 'tags' | 'trending'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    confidence: number
  }[]
}

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics?timeRange=${timeRange}&platform=${selectedPlatform}`)
        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalyticsData()
  }, [timeRange, selectedPlatform])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPercentage = (num: number): string => {
    const sign = num > 0 ? '+' : ''
    return `${sign}${num.toFixed(1)}%`
  }

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-primary/20 text-primary border-primary/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh', timeRange, platform: selectedPlatform })
      })
      if (response.ok) {
        // Refetch data after refresh
        const dataResponse = await fetch(`/api/analytics?timeRange=${timeRange}&platform=${selectedPlatform}`)
        if (dataResponse.ok) {
          const data = await dataResponse.json()
          setAnalyticsData(data)
        }
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleExportData = () => {
    if (!analyticsData) return
    
    const exportData = {
      timeRange,
      platform: selectedPlatform,
      exportDate: new Date().toISOString(),
      ...analyticsData
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${selectedPlatform}-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Start publishing content to see your analytics here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your content performance and audience insights</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export Data</span>
            </button>
            
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            >
              <option value="all">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">X/Twitter</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold text-card-foreground">{formatNumber(analyticsData.overview.totalViews)}</p>
              <p className={`text-sm ${getChangeColor(analyticsData.overview.viewsChange)}`}>
                {formatPercentage(analyticsData.overview.viewsChange)} vs last period
              </p>
            </div>
            <EyeIcon className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Engagement</p>
              <p className="text-2xl font-bold text-card-foreground">{formatNumber(analyticsData.overview.totalEngagement)}</p>
              <p className={`text-sm ${getChangeColor(analyticsData.overview.engagementChange)}`}>
                {formatPercentage(analyticsData.overview.engagementChange)} vs last period
              </p>
            </div>
            <HeartIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Shares</p>
              <p className="text-2xl font-bold text-card-foreground">{formatNumber(analyticsData.overview.totalShares)}</p>
              <p className={`text-sm ${getChangeColor(analyticsData.overview.sharesChange)}`}>
                {formatPercentage(analyticsData.overview.sharesChange)} vs last period
              </p>
            </div>
            <ShareIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Watch Time</p>
              <p className="text-2xl font-bold text-card-foreground">{analyticsData.overview.avgWatchTime}s</p>
              <p className={`text-sm ${getChangeColor(analyticsData.overview.watchTimeChange)}`}>
                {formatPercentage(analyticsData.overview.watchTimeChange)} vs last period
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Platform Performance</h3>
          <div className="space-y-4">
            {analyticsData.platforms.map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <p className="font-medium text-accent-foreground capitalize">{platform.platform}</p>
                    <p className="text-sm text-muted-foreground">{formatNumber(platform.followers)} followers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-accent-foreground">{formatNumber(platform.views)}</p>
                  <p className="text-sm text-muted-foreground">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Content */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Top Performing Content</h3>
          <div className="space-y-4">
            {analyticsData.topPerforming.slice(0, 5).map((content) => (
              <div key={content.id} className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                {content.thumbnailUrl && (
                  <Image
                    src={content.thumbnailUrl}
                    alt={content.title}
                    width={64}
                    height={48}
                    className="object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-accent-foreground truncate">{content.title}</p>
                  <p className="text-sm text-muted-foreground capitalize">{content.platform}</p>
                  <p className="text-sm text-muted-foreground">{new Date(content.publishDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent-foreground">{formatNumber(content.views)}</p>
                  <p className="text-xs text-muted-foreground">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-card-foreground">AI-Powered Recommendations</h3>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyticsData.recommendations.map((rec) => (
            <div key={rec.id} className="relative p-5 border border-border rounded-lg hover:shadow-md transition-shadow bg-accent">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    rec.impact === 'high' ? 'bg-red-500' : 
                    rec.impact === 'medium' ? 'bg-yellow-500' : 'bg-primary'
                  }`} />
                  <h4 className="font-semibold text-accent-foreground">{rec.title}</h4>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getImpactColor(rec.impact)}`}>
                  {rec.impact} impact
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{rec.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                    {rec.type} optimization
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${rec.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{rec.confidence}%</span>
                  </div>
                </div>
                <button className="text-xs text-primary hover:text-primary/80 font-medium">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {analyticsData.recommendations.length === 0 && (
          <div className="text-center py-8">
            <ArrowTrendingUpIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No recommendations available yet.</p>
            <p className="text-sm text-muted-foreground">Create more content to get personalized AI insights.</p>
          </div>
        )}
      </div>

      {/* Audience Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Age Demographics</h3>
          <div className="space-y-3">
            {analyticsData.audience.demographics.map((demo) => (
              <div key={demo.ageGroup} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{demo.ageGroup}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${demo.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">{demo.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Top Locations</h3>
          <div className="space-y-3">
            {analyticsData.audience.locations.map((location) => (
              <div key={location.country} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{location.country}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${location.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">{location.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Device Types</h3>
          <div className="space-y-3">
            {analyticsData.audience.devices.map((device) => (
              <div key={device.type} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{device.type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">{device.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
