/**
 * AudienceInsights Component
 * Displays demographic data, location analytics, and device breakdown
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Globe, Smartphone, Monitor, Tablet } from 'lucide-react'
import type { AudienceInsights as AudienceInsightsType } from '@/lib/types/analytics'

interface AudienceInsightsProps {
  insights: AudienceInsightsType
  isLoading?: boolean
}

interface ProgressBarProps {
  percentage: number
  color?: string
  label: string
  value: string
}

function ProgressBar({ percentage, color = 'bg-blue-500', label, value }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-600">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface MetricsSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isLoading?: boolean
}

function MetricsSection({ title, icon, children, isLoading = false }: MetricsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-base">
            {icon}
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-base">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}

const DEVICE_ICONS = {
  Mobile: Smartphone,
  Desktop: Monitor,
  Tablet: Tablet
} as const

const AGE_COLORS = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500'
]

const LOCATION_COLORS = [
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-gray-500'
]

const DEVICE_COLORS = [
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500'
]

export function AudienceInsights({ insights, isLoading = false }: AudienceInsightsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Audience Insights</h2>
        <div className="text-sm text-gray-500">
          Based on recent analytics data
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demographics */}
        <MetricsSection
          title="Age Demographics"
          icon={<Users className="h-5 w-5 text-blue-600" />}
          isLoading={isLoading}
        >
          {insights.demographics.map((demo, index) => (
            <ProgressBar
              key={demo.ageGroup}
              label={demo.ageGroup}
              value={`${demo.percentage}%`}
              percentage={demo.percentage}
              color={AGE_COLORS[index % AGE_COLORS.length]}
            />
          ))}
        </MetricsSection>

        {/* Locations */}
        <MetricsSection
          title="Top Locations"
          icon={<Globe className="h-5 w-5 text-green-600" />}
          isLoading={isLoading}
        >
          {insights.topLocations.map((location, index) => (
            <ProgressBar
              key={location.country}
              label={location.country}
              value={`${location.percentage}%`}
              percentage={location.percentage}
              color={LOCATION_COLORS[index % LOCATION_COLORS.length]}
            />
          ))}
        </MetricsSection>

        {/* Device Breakdown */}
        <MetricsSection
          title="Device Usage"
          icon={<Monitor className="h-5 w-5 text-purple-600" />}
          isLoading={isLoading}
        >
          {insights.deviceBreakdown.map((device, index) => {
            const DeviceIcon = DEVICE_ICONS[device.device as keyof typeof DEVICE_ICONS] || Monitor
            return (
              <div key={device.device} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <DeviceIcon className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">{device.device}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {device.percentage}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${DEVICE_COLORS[index % DEVICE_COLORS.length]}`}
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </MetricsSection>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">Primary Audience</p>
                <p className="text-lg font-bold text-blue-900">
                  {insights.demographics[0]?.ageGroup || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-800 font-medium">Top Country</p>
                <p className="text-lg font-bold text-green-900">
                  {insights.topLocations[0]?.country || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-800 font-medium">Primary Device</p>
                <p className="text-lg font-bold text-purple-900">
                  {insights.deviceBreakdown[0]?.device || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
