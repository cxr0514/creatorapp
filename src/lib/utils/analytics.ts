/**
 * Analytics utility functions for formatting and calculations
 */

/**
 * Formats a number with appropriate suffixes (K, M)
 * @param num - The number to format
 * @returns Formatted string with suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Formats a percentage change with appropriate sign
 * @param num - The percentage change value
 * @returns Formatted percentage string with sign
 */
export function formatPercentage(num: number): string {
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toFixed(1)}%`
}

/**
 * Gets the appropriate color class for percentage changes
 * @param change - The change percentage
 * @returns Tailwind CSS color class
 */
export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-600'
  if (change < 0) return 'text-red-600'
  return 'text-gray-600'
}

/**
 * Formats time in seconds to a readable format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatWatchTime(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${seconds}s`
}

/**
 * Calculates engagement rate
 * @param engagement - Total engagement
 * @param views - Total views
 * @returns Engagement rate percentage
 */
export function calculateEngagementRate(engagement: number, views: number): number {
  if (views === 0) return 0
  return (engagement / views) * 100
}

/**
 * Generates filename for analytics export
 * @param platform - Platform filter
 * @param timeRange - Time range filter
 * @returns Generated filename
 */
export function generateExportFilename(platform: string, timeRange: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `analytics-${platform}-${timeRange}-${date}.json`
}

/**
 * Validates if a platform is supported
 * @param platform - Platform to validate
 * @returns Boolean indicating if platform is valid
 */
export function isValidPlatform(platform: string): boolean {
  const validPlatforms = ['all', 'youtube', 'tiktok', 'instagram', 'twitter', 'linkedin']
  return validPlatforms.includes(platform.toLowerCase())
}

/**
 * Validates if a time range is supported
 * @param timeRange - Time range to validate
 * @returns Boolean indicating if time range is valid
 */
export function isValidTimeRange(timeRange: string): boolean {
  const validRanges = ['7d', '30d', '90d']
  return validRanges.includes(timeRange)
}

/**
 * Gets time range display label
 * @param timeRange - Time range code
 * @returns Human readable label
 */
export function getTimeRangeLabel(timeRange: string): string {
  const labels: Record<string, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days'
  }
  return labels[timeRange] || timeRange
}

/**
 * Sorts content by performance metric
 * @param content - Array of content items
 * @param metric - Metric to sort by ('views' | 'engagement' | 'shares')
 * @returns Sorted content array
 */
export function sortContentByMetric<T extends { views: number; engagement: number; shares?: number }>(
  content: T[],
  metric: 'views' | 'engagement' | 'shares' = 'views'
): T[] {
  return [...content].sort((a, b) => {
    const aValue = metric === 'shares' ? (a.shares || 0) : a[metric]
    const bValue = metric === 'shares' ? (b.shares || 0) : b[metric]
    return bValue - aValue
  })
}

/**
 * Calculates platform growth rate
 * @param current - Current follower count
 * @param previous - Previous follower count
 * @returns Growth rate percentage
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
