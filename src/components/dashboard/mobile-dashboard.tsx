'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, PanInfo } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  ChevronRightIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  PlayIcon,
  PauseIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline'

interface MobileStatCard {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  action: () => void
}

interface ContentItem {
  id: string
  title: string
  platform: string
  views: number
  thumbnail: string
  status: 'published' | 'scheduled' | 'draft'
  publishDate: string
}

function MobileHeader({ onMenuToggle, userName }: { onMenuToggle: () => void; userName?: string }) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border/50 px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 active:scale-95"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {greeting}
            </h1>
            <p className="text-sm text-muted-foreground">
              {userName?.split(' ')[0] || 'Creator'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors duration-200 active:scale-95">
            <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors duration-200 active:scale-95 relative">
            <BellIcon className="h-5 w-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-error rounded-full animate-pulse" />
          </button>
        </div>
      </div>
    </motion.header>
  )
}

function SwipeableStatCard({ stat, index }: { stat: MobileStatCard; index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100)
        }
      },
      { threshold: 0.3 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [index])

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragOffset(info.offset.x)
  }

  const handleDragEnd = () => {
    setDragOffset(0)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: 50 }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.1}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="bg-surface border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 cursor-grab active:cursor-grabbing touch-pan-y"
      style={{
        background: `linear-gradient(135deg, ${stat.color}08 0%, transparent 100%)`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color.includes('#') ? '' : `from-${stat.color}-500/20 to-${stat.color}-600/20`}`}>
          <stat.icon className={`h-5 w-5 ${stat.color.includes('#') ? '' : `text-${stat.color}-600`}`} />
        </div>
        <div className={`flex items-center space-x-1 ${
          stat.trend === 'up' ? 'text-accent-success' : 'text-accent-error'
        }`}>
          <ArrowTrendingUpIcon className={`h-4 w-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium">{stat.change}</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
      </div>
      
      {/* Swipe indicator */}
      {Math.abs(dragOffset) > 20 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-primary/10 rounded-2xl flex items-center justify-center"
        >
          <p className="text-primary font-medium">Swipe for more info</p>
        </motion.div>
      )}
    </motion.div>
  )
}

function HorizontalScrollActions({ actions }: { actions: QuickAction[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4 px-4">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        <button className="text-primary text-sm font-medium">View All</button>
      </div>
      <div
        ref={scrollRef}
        className="flex space-x-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={action.action}
            className={`
              flex-shrink-0 w-32 h-32 rounded-2xl p-4 text-left transition-all duration-300
              ${action.color} hover:scale-105 active:scale-95 snap-start
              bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20
            `}
          >
            <div className="h-full flex flex-col justify-between">
              <div className="p-2 bg-primary/20 rounded-lg self-start">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{action.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function ContentList({ items }: { items: ContentItem[] }) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Content</h3>
        <button className="text-primary text-sm font-medium">Manage</button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
            className={`
              bg-surface border border-border/50 rounded-xl p-4 transition-all duration-300
              ${selectedItem === item.id ? 'shadow-lg border-primary/50' : 'hover:shadow-md'}
              active:scale-98 cursor-pointer
            `}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center">
                <PlayIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-muted-foreground capitalize">{item.platform}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{item.views.toLocaleString()} views</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`
                  w-2 h-2 rounded-full
                  ${item.status === 'published' ? 'bg-accent-success' : 
                    item.status === 'scheduled' ? 'bg-accent-warning' : 'bg-muted-foreground'}
                `} />
                <ChevronRightIcon className={`
                  h-4 w-4 text-muted-foreground transition-transform duration-300
                  ${selectedItem === item.id ? 'rotate-90' : ''}
                `} />
              </div>
            </div>
            
            <motion.div
              initial={false}
              animate={{
                height: selectedItem === item.id ? 'auto' : 0,
                opacity: selectedItem === item.id ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-border/30">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <EyeIcon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Views</p>
                    <p className="text-sm font-semibold text-foreground">{item.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <HeartIcon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Likes</p>
                    <p className="text-sm font-semibold text-foreground">{Math.floor(item.views * 0.08).toLocaleString()}</p>
                  </div>
                  <div>
                    <ShareIcon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Shares</p>
                    <p className="text-sm font-semibold text-foreground">{Math.floor(item.views * 0.03).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium active:scale-95 transition-transform">
                    Edit
                  </button>
                  <button className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg text-sm font-medium active:scale-95 transition-transform">
                    Share
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function FloatingActionButton({ onTap }: { onTap: () => void }) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onTapStart={() => setIsPressed(true)}
      onTap={() => {
        setIsPressed(false)
        onTap()
      }}
      onTapCancel={() => setIsPressed(false)}
      className={`
        fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-primary/90 
        rounded-full shadow-lg shadow-primary/30 flex items-center justify-center
        transition-all duration-300 z-50
        ${isPressed ? 'shadow-xl shadow-primary/50' : ''}
      `}
    >
      <PlusIcon className="h-6 w-6 text-primary-foreground" />
      <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
    </motion.button>
  )
}

function PullToRefresh({ onRefresh, children }: { onRefresh: () => void; children: React.ReactNode }) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const { scrollY } = useScroll()
  const pullThreshold = 100

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (scrollY.get() <= 0 && info.delta.y > 0) {
      setIsPulling(true)
      setPullDistance(Math.min(info.offset.y, pullThreshold * 1.5))
    }
  }

  const handleDragEnd = () => {
    if (pullDistance >= pullThreshold) {
      onRefresh()
    }
    setIsPulling(false)
    setPullDistance(0)
  }

  const refreshOpacity = useTransform(
    () => pullDistance,
    [0, pullThreshold],
    [0, 1]
  )

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="relative"
    >
      {isPulling && (
        <motion.div
          style={{ opacity: refreshOpacity }}
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10"
        >
          <div className="flex items-center space-x-2 text-primary">
            <ArrowUpIcon className={`h-4 w-4 transition-transform duration-300 ${
              pullDistance >= pullThreshold ? 'rotate-180' : ''
            }`} />
            <span className="text-sm font-medium">
              {pullDistance >= pullThreshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </motion.div>
      )}
      {children}
    </motion.div>
  )
}

interface MobileDashboardProps {
  stats: MobileStatCard[]
  quickActions: QuickAction[]
  contentItems: ContentItem[]
  userName?: string
  onMenuToggle: () => void
  onRefresh: () => void
  onCreateContent: () => void
}

export function MobileDashboard({
  stats,
  quickActions,
  contentItems,
  userName,
  onMenuToggle,
  onRefresh,
  onCreateContent
}: MobileDashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <MobileHeader onMenuToggle={onMenuToggle} userName={userName} />
      
      <PullToRefresh onRefresh={onRefresh}>
        <div className="pb-20">
          {/* Stats Grid */}
          <div className="px-4 py-6">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <SwipeableStatCard key={stat.title} stat={stat} index={index} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <HorizontalScrollActions actions={quickActions} />

          {/* Content List */}
          <ContentList items={contentItems} />
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton onTap={onCreateContent} />
    </div>
  )
}
