import { Platform, TimeRange, ImpactLevel } from './types/analytics'

// Platform Configuration
export const PLATFORMS: Array<{ value: Platform; label: string; icon: string; colorClass: string }> = [
  { value: 'all', label: 'All Platforms', icon: 'Globe', colorClass: 'text-muted-foreground' },
  { value: 'youtube', label: 'YouTube', icon: 'Play', colorClass: 'text-red-600' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music', colorClass: 'text-black' },
  { value: 'instagram', label: 'Instagram', icon: 'Camera', colorClass: 'text-pink-600' },
  { value: 'twitter', label: 'X/Twitter', icon: 'MessageCircle', colorClass: 'text-blue-500' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Briefcase', colorClass: 'text-blue-700' }
]

// Time Range Configuration
export const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' }
]

// Validation Constants
export const VALID_TIME_RANGES: TimeRange[] = ['7d', '30d', '90d']
export const VALID_PLATFORMS: Platform[] = ['all', 'youtube', 'tiktok', 'instagram', 'twitter', 'linkedin']

// Impact Level Colors
export const IMPACT_COLORS: Record<ImpactLevel, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200'
}

// Platform Distribution Weights (for mock data generation)
export const PLATFORM_WEIGHTS = {
  youtube: { views: 0.4, engagement: 0.4, shares: 0.3 },
  tiktok: { views: 0.3, engagement: 0.35, shares: 0.4 },
  instagram: { views: 0.2, engagement: 0.2, shares: 0.2 },
  twitter: { views: 0.08, engagement: 0.04, shares: 0.08 },
  linkedin: { views: 0.02, engagement: 0.01, shares: 0.02 }
}

// Platform distribution weights for mock data generation
export const PLATFORM_DISTRIBUTION = {
  youtube: 0.4,
  tiktok: 0.3,
  instagram: 0.2,
  twitter: 0.05,
  linkedin: 0.05
} as const

// Mock data generation constants
export const MOCK_DATA_RANGES = {
  BASE_VIEWS: { min: 10000, max: 100000 },
  ENGAGEMENT_RATE: { min: 0.05, max: 0.15 },
  SHARE_RATE: { min: 0.01, max: 0.03 },
  WATCH_TIME: { min: 30, max: 180 },
  FOLLOWER_COUNTS: {
    youtube: { min: 10000, max: 20000 },
    tiktok: { min: 5000, max: 15000 },
    instagram: { min: 8000, max: 18000 },
    twitter: { min: 3000, max: 10000 },
    linkedin: { min: 1000, max: 5000 }
  }
} as const

// Default Analytics Configuration
export const DEFAULT_CONFIG = {
  timeRange: '30d' as TimeRange,
  platform: 'all' as Platform,
  refreshInterval: 30000, // 30 seconds
  maxRecommendations: 6,
  minRecommendations: 4
}

// API Endpoints
export const API_ENDPOINTS = {
  ANALYTICS: '/api/analytics'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  unauthorized: 'Unauthorized access',
  invalidTimeRange: 'Invalid time range',
  invalidPlatform: 'Invalid platform',
  invalidAction: 'Invalid action',
  validationError: 'Request validation failed',
  fetchFailed: 'Failed to fetch analytics data',
  fetchError: 'Failed to fetch analytics data',
  actionFailed: 'Failed to process analytics action',
  exportFailed: 'Failed to export analytics data',
  exportError: 'Failed to export analytics data',
  unknownError: 'An unknown error occurred',
  notFound: 'Resource not found'
} as const
