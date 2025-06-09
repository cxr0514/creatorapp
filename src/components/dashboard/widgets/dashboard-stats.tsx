'use client'

import { 
  VideoCameraIcon, 
  PlayIcon, 
  ClockIcon, 
  CircleStackIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline'

interface StatItem {
  name: string
  value: string
  change: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
}

interface MetricItem {
  name: string
  value: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  trend: string
}

const stats: StatItem[] = [
  { name: 'Videos', value: '247', change: '+12%', icon: VideoCameraIcon, color: 'text-primary' },
  { name: 'Published', value: '189', change: '+8%', icon: PlayIcon, color: 'text-accent-success' },
  { name: 'Scheduled', value: '23', change: '+15%', icon: ClockIcon, color: 'text-primary' },
  { name: 'Storage', value: '4.2GB', change: '+2%', icon: CircleStackIcon, color: 'text-accent-warning' },
]

const recentMetrics: MetricItem[] = [
  { name: 'Total Views', value: '12.4K', icon: EyeIcon, trend: '+18%' },
  { name: 'Engagement', value: '8.2%', icon: HeartIcon, trend: '+5%' },
  { name: 'Shares', value: '342', icon: ShareIcon, trend: '+23%' },
]

export function DashboardStats() {
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    {item.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-foreground">
                      {item.value}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-accent-success">
                      {item.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Metrics */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Recent Performance</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {recentMetrics.map((item) => (
            <div key={item.name} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{item.name}</div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-foreground">{item.value}</span>
                  <span className="text-sm text-accent-success">{item.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
