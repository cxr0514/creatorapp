// Analytics Types and Interfaces
// Centralized type definitions for analytics functionality

export type TimeRange = '7d' | '30d' | '90d'
export type Platform = 'all' | 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin'
export type RecommendationType = 'length' | 'style' | 'tags' | 'trending'
export type ImpactLevel = 'high' | 'medium' | 'low'
export type AnalyticsAction = 'refresh' | 'track_engagement'

export interface OverviewMetrics {
  totalViews: number
  totalEngagement: number
  totalShares: number
  avgWatchTime: number
  viewsChange: number
  engagementChange: number
  sharesChange: number
  watchTimeChange: number
}

export interface PlatformMetrics {
  platform: string
  views: number
  engagement: number
  shares: number
  avgWatchTime: number
  followers: number
  icon: string
}

export interface TopPerformingContent {
  id: string
  title: string
  platform: string
  views: number
  engagement: number
  publishDate: string
  thumbnailUrl?: string
}

export interface DemographicData {
  ageGroup: string
  percentage: number
}

export interface LocationData {
  country: string
  percentage: number
}

export interface DeviceData {
  device: string
  percentage: number
}

export interface AudienceInsights {
  demographics: DemographicData[]
  topLocations: LocationData[]
  deviceBreakdown: DeviceData[]
}

export interface AIRecommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  impact: ImpactLevel
  estimatedImprovement: string
  confidence?: number
}

export interface AnalyticsData {
  overview: OverviewMetrics
  platforms: PlatformMetrics[]
  topContent: TopPerformingContent[]
  aiRecommendations: AIRecommendation[]
  audienceInsights: AudienceInsights
}

export interface AnalyticsApiRequest {
  timeRange?: TimeRange
  platform?: Platform
}

export interface AnalyticsActionRequest {
  action: AnalyticsAction
  timeRange?: TimeRange
  platform?: Platform
  contentId?: string
}

export interface ExportData {
  format: 'json' | 'csv' | 'xlsx'
  includeRawData: boolean
  dateRange: {
    start: string
    end: string
  }
}

// API Response Types
export interface AnalyticsApiResponse {
  success: boolean
  data: AnalyticsData
  timestamp: string
}

export interface AnalyticsApiError {
  success: false
  error: {
    message: string
    code: string
    details?: string
  }
  timestamp: string
}

// Error handling types
export interface ErrorState {
  message: string
  code: string
  details?: string
}
