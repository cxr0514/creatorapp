'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  ScissorsIcon, 
  CalendarIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CloudArrowUpIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface StatCardProps {
  item: {
    name: string
    value: string
    change: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
  index: number
}

function AnimatedStatCard({ item, index }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100)
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [index])

  return (
    <div 
      ref={cardRef}
      className={`
        bg-surface overflow-hidden shadow-sm rounded-xl border border-border/50
        transition-all duration-500 cursor-pointer group
        ${isVisible ? 'animate-bounce-in' : 'opacity-0 translate-y-8'}
        ${isHovered ? 'shadow-xl shadow-primary/20 scale-105' : 'hover:shadow-lg hover:shadow-primary/10'}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6 relative overflow-hidden">
        {/* Background glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`
                p-3 rounded-xl transition-all duration-300 group-hover:scale-110
                ${isHovered ? 'animate-wiggle bg-primary/20' : 'bg-primary/10'}
              `}>
                <item.icon className={`h-6 w-6 ${item.color} transition-colors duration-300`} />
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {item.name}
                </dt>
                <dd className="mt-1">
                  <div className={`
                    text-2xl font-bold text-foreground transition-all duration-300
                    ${isHovered ? 'scale-110' : ''}
                  `}>
                    {item.value}
                  </div>
                </dd>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="flex items-center text-sm">
              <ArrowTrendingUpIcon className="h-4 w-4 text-accent-success mr-2 group-hover:animate-bounce-subtle" />
              <span className="text-accent-success font-semibold">{item.change}</span>
              <span className="text-muted-foreground ml-2">vs last month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  metric: {
    name: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    trend: string
  }
  index: number
}

function AnimatedMetricCard({ metric, index }: MetricCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 150)
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [index])

  return (
    <div 
      ref={cardRef}
      className={`
        p-4 bg-gradient-to-r from-surface to-surface/80 rounded-lg border border-border/30
        transition-all duration-500 hover:scale-105 hover:shadow-lg hover:border-primary/30
        ${isVisible ? 'animate-slide-in' : 'opacity-0 translate-x-4'}
        group cursor-pointer
      `}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
            <metric.icon className="h-5 w-5 text-primary group-hover:animate-pulse" />
          </div>
          <div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300">
              {metric.name}
            </span>
            <div className="flex items-center mt-1">
              <span className="text-lg font-semibold text-foreground">{metric.value}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-success/20 text-accent-success">
            {metric.trend}
          </span>
        </div>
      </div>
    </div>
  )
}

interface QuickActionProps {
  action: {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    onClick: () => void
  }
  index: number
}

function AnimatedQuickAction({ action, index }: QuickActionProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  return (
    <button
      className={`
        relative p-6 text-left rounded-xl border-2 border-dashed transition-all duration-300
        ${isHovered 
          ? 'border-primary bg-primary/5 scale-105 shadow-lg shadow-primary/20' 
          : 'border-border hover:border-primary/50'
        }
        ${isPressed ? 'scale-95' : ''}
        group overflow-hidden
      `}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={action.onClick}
    >
      {/* Background animation */}
      <div className={`
        absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent
        transition-all duration-500 opacity-0 group-hover:opacity-100
      `} />
      
      {/* Ripple effect */}
      <div className={`
        absolute inset-0 rounded-xl bg-primary/20 scale-0 group-active:scale-100
        transition-transform duration-300 opacity-60
      `} />
      
      <div className="relative z-10">
        <div className={`
          ${action.color} mb-4 p-3 rounded-lg inline-block transition-all duration-300
          ${isHovered ? 'animate-bounce-subtle bg-primary/20' : 'bg-primary/10'}
        `}>
          <action.icon className="h-6 w-6" />
        </div>
        <h3 className={`
          text-lg font-semibold transition-colors duration-300
          ${isHovered ? 'text-primary' : 'text-foreground'}
        `}>
          {action.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
          {action.description}
        </p>
      </div>
    </button>
  )
}

interface EnhancedDashboardProps {
  stats: Array<{
    name: string
    value: string
    change: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }>
  recentMetrics: Array<{
    name: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    trend: string
  }>
  quickActions: Array<{
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    onClick: () => void
  }>
  userName?: string
}

export function EnhancedDashboard({ stats, recentMetrics, quickActions, userName }: EnhancedDashboardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState('')

  useEffect(() => {
    setIsLoaded(true)
    
    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('Good morning')
    else if (hour < 18) setTimeOfDay('Good afternoon')
    else setTimeOfDay('Good evening')
  }, [])

  return (
    <div className={`space-y-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header with enhanced animations */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground animate-slide-down">
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {timeOfDay}
          </span>
          <span className="ml-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
            {userName ? userName.split(' ')[0] : 'Creator'}! 
          </span>
          <span className="ml-2 animate-bounce-subtle inline-block" style={{ animationDelay: '500ms' }}>
            👋
          </span>
        </h1>
        <p className="text-muted-foreground animate-slide-up" style={{ animationDelay: '200ms' }}>
          Here&apos;s what&apos;s happening with your content today.
        </p>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <AnimatedStatCard key={item.name} item={item} index={index} />
        ))}
      </div>

      {/* Quick Actions with enhanced animations */}
      <div className="bg-surface shadow-lg rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50 bg-gradient-to-r from-surface to-surface/80">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <SparklesIcon className="h-5 w-5 mr-2 text-primary animate-spin-slow" />
            Quick Actions
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started with these powerful tools
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <AnimatedQuickAction key={action.title} action={action} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights with enhanced design */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-surface shadow-lg rounded-2xl border border-border/50 p-6 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
              Performance Insights
            </h3>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:animate-pulse">
              <ChartBarIcon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="space-y-4">
            {recentMetrics.map((metric, index) => (
              <AnimatedMetricCard key={metric.name} metric={metric} index={index} />
            ))}
          </div>
        </div>

        {/* Recent Activity with timeline animation */}
        <div className="bg-surface shadow-lg rounded-2xl border border-border/50 p-6 overflow-hidden">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[
              { action: 'Created new content', target: '"Best Moments"', time: '2h ago', icon: ScissorsIcon },
              { action: 'Video uploaded', target: '"Tutorial Series #3"', time: '4h ago', icon: CloudArrowUpIcon },
              { action: 'Post scheduled', target: 'Instagram', time: '6h ago', icon: CalendarIcon },
            ].map((activity, index) => (
              <div 
                key={index} 
                className={`
                  flex items-center space-x-4 p-3 rounded-lg border border-border/30 
                  transition-all duration-500 hover:bg-primary/5 hover:border-primary/30
                  animate-slide-in group cursor-pointer
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                  <activity.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground group-hover:text-primary transition-colors duration-300">
                    {activity.action} <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
