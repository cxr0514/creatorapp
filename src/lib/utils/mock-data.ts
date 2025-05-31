/**
 * Mock data generation utilities for analytics
 * In production, this would be replaced with actual platform API integrations
 */

import type { 
  AnalyticsData, 
  TimeRange, 
  Platform, 
  PlatformMetrics, 
  TopPerformingContent,
  AIRecommendation,
  DemographicData,
  LocationData,
  DeviceData
} from '../types/analytics'
import { 
  PLATFORMS, 
  PLATFORM_DISTRIBUTION, 
  MOCK_DATA_RANGES 
} from '../analytics-constants'

/**
 * Generates random number within a range
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generates random percentage change
 */
function randomChange(maxChange: number = 30): number {
  return (Math.random() - 0.5) * maxChange * 2
}

/**
 * Generates mock platform metrics
 */
function generatePlatformMetrics(baseViews: number, baseEngagement: number, baseShares: number, avgWatchTime: number): PlatformMetrics[] {
  return PLATFORMS.slice(1).map(platform => { // Skip 'all' platform
    const distribution = PLATFORM_DISTRIBUTION[platform.value as keyof typeof PLATFORM_DISTRIBUTION] || 0.1
    const followerRange = MOCK_DATA_RANGES.FOLLOWER_COUNTS[platform.value as keyof typeof MOCK_DATA_RANGES.FOLLOWER_COUNTS]
    
    return {
      platform: platform.value,
      views: Math.floor(baseViews * distribution),
      engagement: Math.floor(baseEngagement * distribution),
      shares: Math.floor(baseShares * distribution),
      avgWatchTime: avgWatchTime + randomInRange(-20, 30),
      followers: followerRange ? randomInRange(followerRange.min, followerRange.max) : randomInRange(1000, 10000),
      icon: platform.icon
    }
  })
}

/**
 * Generates mock top performing content
 */
function generateTopContent(): TopPerformingContent[] {
  const titles = [
    "How to Create Engaging Content in 2025",
    "5 Social Media Trends You Can't Ignore",
    "Building Your Personal Brand",
    "Content Creation Tips for Beginners",
    "Viral Video Strategies That Work",
    "Photography Tips for Social Media",
    "Growing Your Audience Organically",
    "Content Planning and Scheduling"
  ]

  return titles.slice(0, 5).map((title, index) => ({
    id: `content-${index + 1}`,
    title,
    platform: ['youtube', 'tiktok', 'instagram', 'twitter'][index % 4],
    views: randomInRange(5000, 50000),
    engagement: randomInRange(500, 5000),
    publishDate: new Date(Date.now() - randomInRange(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: `/api/placeholder/300/200?text=${encodeURIComponent(title)}`
  }))
}

/**
 * Generates mock AI recommendations
 */
function generateAIRecommendations(): AIRecommendation[] {
  const recommendations = [
    {
      id: '1',
      type: 'length' as const,
      title: 'Optimize Video Length',
      description: 'Your videos perform better when they are 2-3 minutes long. Consider shortening your content.',
      impact: 'high' as const,
      estimatedImprovement: '25% more engagement'
    },
    {
      id: '2',
      type: 'trending' as const,
      title: 'Trending Topics',
      description: 'AI productivity tools are trending. Consider creating content about workflow automation.',
      impact: 'medium' as const,
      estimatedImprovement: '15% more reach'
    },
    {
      id: '3',
      type: 'tags' as const,
      title: 'Hashtag Optimization',
      description: 'Use 5-7 hashtags for optimal reach. Mix popular and niche tags.',
      impact: 'medium' as const,
      estimatedImprovement: '20% more discovery'
    },
    {
      id: '4',
      type: 'style' as const,
      title: 'Visual Style',
      description: 'Bright, high-contrast thumbnails get 30% more clicks.',
      impact: 'high' as const,
      estimatedImprovement: '30% higher CTR'
    }
  ]

  return recommendations
}

/**
 * Generates mock demographic data
 */
function generateDemographics(): DemographicData[] {
  return [
    { ageGroup: '18-24', percentage: 25 },
    { ageGroup: '25-34', percentage: 35 },
    { ageGroup: '35-44', percentage: 20 },
    { ageGroup: '45-54', percentage: 15 },
    { ageGroup: '55+', percentage: 5 }
  ]
}

/**
 * Generates mock location data
 */
function generateLocations(): LocationData[] {
  return [
    { country: 'United States', percentage: 45 },
    { country: 'Canada', percentage: 15 },
    { country: 'United Kingdom', percentage: 12 },
    { country: 'Australia', percentage: 8 },
    { country: 'Germany', percentage: 6 },
    { country: 'Other', percentage: 14 }
  ]
}

/**
 * Generates mock device data
 */
function generateDeviceData(): DeviceData[] {
  return [
    { device: 'Mobile', percentage: 70 },
    { device: 'Desktop', percentage: 20 },
    { device: 'Tablet', percentage: 10 }
  ]
}

/**
 * Main function to generate complete mock analytics data
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateMockAnalyticsData(timeRange: TimeRange, _platform: Platform): AnalyticsData {
  // Base metrics influenced by time range
  const timeMultiplier = timeRange === '7d' ? 0.3 : timeRange === '30d' ? 1 : 1.8
  
  // Note: Platform filtering could be implemented here for production
  // Currently generating data for all platforms regardless of filter
  
  const baseViews = Math.floor((randomInRange(MOCK_DATA_RANGES.BASE_VIEWS.min, MOCK_DATA_RANGES.BASE_VIEWS.max)) * timeMultiplier)
  const engagementRate = Math.random() * (MOCK_DATA_RANGES.ENGAGEMENT_RATE.max - MOCK_DATA_RANGES.ENGAGEMENT_RATE.min) + MOCK_DATA_RANGES.ENGAGEMENT_RATE.min
  const shareRate = Math.random() * (MOCK_DATA_RANGES.SHARE_RATE.max - MOCK_DATA_RANGES.SHARE_RATE.min) + MOCK_DATA_RANGES.SHARE_RATE.min
  
  const baseEngagement = Math.floor(baseViews * engagementRate)
  const baseShares = Math.floor(baseViews * shareRate)
  const avgWatchTime = randomInRange(MOCK_DATA_RANGES.WATCH_TIME.min, MOCK_DATA_RANGES.WATCH_TIME.max)

  return {
    overview: {
      totalViews: baseViews,
      totalEngagement: baseEngagement,
      totalShares: baseShares,
      avgWatchTime: avgWatchTime,
      viewsChange: randomChange(25),
      engagementChange: randomChange(30),
      sharesChange: randomChange(40),
      watchTimeChange: randomChange(20)
    },
    platforms: generatePlatformMetrics(baseViews, baseEngagement, baseShares, avgWatchTime),
    topContent: generateTopContent(),
    aiRecommendations: generateAIRecommendations(),
    audienceInsights: {
      demographics: generateDemographics(),
      topLocations: generateLocations(),
      deviceBreakdown: generateDeviceData()
    }
  }
}
