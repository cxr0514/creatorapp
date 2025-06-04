'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon,
  PlayIcon,
  UserGroupIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'

interface MetricData {
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

interface ChartData {
  name: string
  views: number
  engagement: number
  shares: number
  watchTime: number
}

interface PlatformData {
  platform: string
  value: number
  color: string
  icon: React.ComponentType<{ className?: string }>
}

interface AdvancedAnalyticsProps {
  timeRange: '7d' | '30d' | '90d'
  className?: string
}

const mockChartData: ChartData[] = [
  { name: 'Mon', views: 4000, engagement: 240, shares: 24, watchTime: 1200 },
  { name: 'Tue', views: 3000, engagement: 139, shares: 22, watchTime: 900 },
  { name: 'Wed', views: 2000, engagement: 980, shares: 89, watchTime: 1800 },
  { name: 'Thu', views: 2780, engagement: 390, shares: 39, watchTime: 1390 },
  { name: 'Fri', views: 1890, engagement: 480, shares: 48, watchTime: 945 },
  { name: 'Sat', views: 2390, engagement: 380, shares: 38, watchTime: 1195 },
  { name: 'Sun', views: 3490, engagement: 430, shares: 43, watchTime: 1745 },
]

const platformData: PlatformData[] = [
  { platform: 'YouTube', value: 45, color: '#FF0000', icon: PlayIcon },
  { platform: 'TikTok', value: 30, color: '#000000', icon: DevicePhoneMobileIcon },
  { platform: 'Instagram', value: 20, color: '#E4405F', icon: HeartIcon },
  { platform: 'Twitter', value: 5, color: '#1DA1F2', icon: ShareIcon },
]

const deviceData = [
  { name: 'Mobile', value: 65, icon: DevicePhoneMobileIcon, color: '#8B5CF6' },
  { name: 'Desktop', value: 30, icon: ComputerDesktopIcon, color: '#06B6D4' },
  { name: 'Tablet', value: 5, icon: RectangleStackIcon, color: '#10B981' },
]

const audienceData = [
  { age: '18-24', value: 35, color: '#F59E0B' },
  { age: '25-34', value: 40, color: '#8B5CF6' },
  { age: '35-44', value: 20, color: '#06B6D4' },
  { age: '45+', value: 5, color: '#10B981' },
]

function AnimatedMetric({ icon: Icon, title, value, change, trend }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  value: string
  change: number
  trend: 'up' | 'down' | 'stable'
}) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (inView) {
      const numValue = parseInt(value.replace(/[^0-9]/g, ''))
      let start = 0
      const increment = numValue / 50
      const timer = setInterval(() => {
        start += increment
        if (start >= numValue) {
          setDisplayValue(numValue)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(start))
        }
      }, 20)
      return () => clearInterval(timer)
    }
  }, [inView, value])

  const TrendIcon = trend === 'up' ? ArrowTrendingUpIcon : trend === 'down' ? ArrowTrendingDownIcon : null

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-surface border border-border/50 rounded-xl p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {TrendIcon && (
          <div className={`flex items-center space-x-1 ${
            trend === 'up' ? 'text-accent-success' : 'text-accent-error'
          }`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className="text-2xl font-bold text-foreground">
          {value.includes('K') || value.includes('M') ? value.replace(/[0-9]/g, (match) => {
            const index = value.indexOf(match)
            return index < value.length - 1 ? displayValue.toString()[index] || '0' : match
          }) : displayValue.toLocaleString()}
        </p>
      </div>
    </motion.div>
  )
}

function InteractiveLineChart({ data }: { data: ChartData[] }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [activeMetric, setActiveMetric] = useState<keyof ChartData>('views')

  const metrics = [
    { key: 'views' as keyof ChartData, label: 'Views', color: '#8B5CF6', icon: EyeIcon },
    { key: 'engagement' as keyof ChartData, label: 'Engagement', color: '#F59E0B', icon: HeartIcon },
    { key: 'shares' as keyof ChartData, label: 'Shares', color: '#10B981', icon: ShareIcon },
    { key: 'watchTime' as keyof ChartData, label: 'Watch Time', color: '#06B6D4', icon: ClockIcon },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="bg-surface border border-border/50 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance Trends</h3>
        <div className="flex items-center space-x-2">
          {metrics.map(({ key, label, color, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${activeMetric === key 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={metrics.find(m => m.key === activeMetric)?.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={metrics.find(m => m.key === activeMetric)?.color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Area
            type="monotone"
            dataKey={activeMetric}
            stroke={metrics.find(m => m.key === activeMetric)?.color}
            fillOpacity={1}
            fill="url(#colorGradient)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

function PlatformBreakdown({ data }: { data: PlatformData[] }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="bg-surface border border-border/50 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
        <GlobeAltIcon className="h-5 w-5 mr-2 text-primary" />
        Platform Distribution
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationBegin={inView ? 0 : undefined}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="space-y-4">
          {data.map((platform, index) => (
            <motion.div
              key={platform.platform}
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-300"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${platform.color}20` }}>
                  <platform.icon className="h-4 w-4 text-current" />
                </div>
                <span className="font-medium text-foreground">{platform.platform}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${platform.value}%` } : {}}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">{platform.value}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function AudienceInsights() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [activeTab, setActiveTab] = useState<'age' | 'device'>('age')

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="bg-surface border border-border/50 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2 text-primary" />
          Audience Insights
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('age')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
              ${activeTab === 'age' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-primary/10'
              }
            `}
          >
            Age Groups
          </button>
          <button
            onClick={() => setActiveTab('device')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
              ${activeTab === 'device' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-primary/10'
              }
            `}
          >
            Devices
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'age' ? (
          <motion.div
            key="age"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {audienceData.map((item, index) => (
              <div key={item.age} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{item.age}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${item.value}%` } : {}}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8">{item.value}%</span>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="device"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {deviceData.map((device, index) => (
              <div key={device.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${device.color}20` }}>
                    <device.icon className="h-4 w-4" style={{ color: device.color }} />
                  </div>
                  <span className="font-medium text-foreground">{device.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${device.value}%` } : {}}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: device.color }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{device.value}%</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function AdvancedAnalytics({ timeRange, className }: AdvancedAnalyticsProps) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const metrics = [
    { icon: EyeIcon, title: 'Total Views', value: '24.3K', change: 18, trend: 'up' as const },
    { icon: HeartIcon, title: 'Engagement Rate', value: '8.2%', change: 5, trend: 'up' as const },
    { icon: ShareIcon, title: 'Total Shares', value: '1.4K', change: -2, trend: 'down' as const },
    { icon: ClockIcon, title: 'Avg Watch Time', value: '2m 45s', change: 12, trend: 'up' as const },
  ]

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Advanced Analytics Dashboard
        </h2>
        <p className="text-muted-foreground">
          Deep insights into your content performance over the last {timeRange.replace('d', ' days')}
        </p>
      </motion.div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <AnimatedMetric key={metric.title} {...metric} />
        ))}
      </div>

      {/* Performance Trends */}
      <InteractiveLineChart data={mockChartData} />

      {/* Platform and Audience Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PlatformBreakdown data={platformData} />
        <AudienceInsights />
      </div>
    </div>
  )
}
