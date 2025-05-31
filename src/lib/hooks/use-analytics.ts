/**
 * Custom hooks for analytics data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react'
import type { AnalyticsData, TimeRange, Platform, ErrorState } from '../types/analytics'
import { API_ENDPOINTS, ERROR_MESSAGES } from '../analytics-constants'

/**
 * Hook for fetching analytics data with loading and error states
 */
export function useAnalyticsData(timeRange: TimeRange = '30d', platform: Platform = 'all') {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorState | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}?timeRange=${timeRange}&platform=${platform}`)
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? ERROR_MESSAGES.notFound : ERROR_MESSAGES.fetchError)
      }
      
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : ERROR_MESSAGES.unknownError,
        code: 'FETCH_ERROR'
      })
    } finally {
      setLoading(false)
    }
  }, [timeRange, platform])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

/**
 * Hook for managing dashboard filters
 */
export function useDashboardFilters() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [platform, setPlatform] = useState<Platform>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  const updateFilters = (newTimeRange?: TimeRange, newPlatform?: Platform) => {
    if (newTimeRange) setTimeRange(newTimeRange)
    if (newPlatform) setPlatform(newPlatform)
  }

  const refresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return {
    timeRange,
    platform,
    refreshKey,
    setTimeRange,
    setPlatform,
    updateFilters,
    refresh
  }
}

/**
 * Hook for data export functionality
 */
export function useDataExport() {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportData = async (data: AnalyticsData, platform: Platform, timeRange: TimeRange) => {
    try {
      setExporting(true)
      setError(null)

      const exportData = {
        exportDate: new Date().toISOString(),
        filters: { platform, timeRange },
        data: data
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${platform}-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.exportError)
    } finally {
      setExporting(false)
    }
  }

  return {
    exporting,
    error,
    exportData
  }
}

/**
 * Hook for real-time data updates
 */
export function useRealTimeUpdates(intervalMs: number = 300000) { // 5 minutes default
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, intervalMs)

    return () => clearInterval(interval)
  }, [autoRefresh, intervalMs])

  return {
    lastUpdate,
    autoRefresh,
    setAutoRefresh,
    triggerUpdate: () => setLastUpdate(new Date())
  }
}

/**
 * Hook for managing dashboard view state
 */
export function useDashboardView() {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const isSectionExpanded = (sectionId: string) => expandedSections.has(sectionId)

  return {
    viewMode,
    setViewMode,
    expandedSections,
    toggleSection,
    isSectionExpanded
  }
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMetrics() {
  const [loadTime, setLoadTime] = useState<number | null>(null)
  const [renderTime, setRenderTime] = useState<number | null>(null)

  const startMeasure = (measureName: string) => {
    performance.mark(`${measureName}-start`)
  }

  const endMeasure = (measureName: string) => {
    performance.mark(`${measureName}-end`)
    performance.measure(measureName, `${measureName}-start`, `${measureName}-end`)
    
    const measure = performance.getEntriesByName(measureName)[0]
    if (measureName === 'data-load') {
      setLoadTime(measure.duration)
    } else if (measureName === 'component-render') {
      setRenderTime(measure.duration)
    }
    
    return measure.duration
  }

  return {
    loadTime,
    renderTime,
    startMeasure,
    endMeasure
  }
}
