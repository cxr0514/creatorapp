'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  Settings,
  TestTube,
  Globe,
  BarChart3,
  Bell,
  Calendar,
  Zap,
  ArrowRight
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  description?: string
  badge?: string
  disabled?: boolean
}

export function SocialMediaNav() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <Home className="w-4 h-4" />,
      description: 'Main dashboard and overview'
    },
    {
      label: 'Social Demo',
      href: '/social-demo',
      icon: <Globe className="w-4 h-4" />,
      description: 'Social media connections and publishing',
      badge: 'Demo'
    },
    {
      label: 'Test Suite',
      href: '/social-test',
      icon: <TestTube className="w-4 h-4" />,
      description: 'Comprehensive testing interface',
      badge: 'New'
    },
    {
      label: 'Integrations',
      href: '/settings/integrations',
      icon: <Settings className="w-4 h-4" />,
      description: 'Platform settings and notifications',
      badge: 'Settings'
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Performance metrics and insights',
      disabled: true,
      badge: 'Coming Soon'
    },
    {
      label: 'Scheduling',
      href: '/scheduling',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Content calendar and automation',
      disabled: true,
      badge: 'Coming Soon'
    }
  ]

  const quickActions = [
    {
      label: 'Test Notifications',
      action: () => window.location.href = '/social-test#notifications',
      icon: <Bell className="w-4 h-4" />
    },
    {
      label: 'Connect Platforms',
      action: () => window.location.href = '/social-demo#connections',
      icon: <Globe className="w-4 h-4" />
    },
    {
      label: 'View Settings',
      action: () => window.location.href = '/settings/integrations',
      icon: <Settings className="w-4 h-4" />
    }
  ]

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">CreatorApp</h1>
            <p className="text-sm text-gray-600">Social Media Hub</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navigation
          </h2>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isDisabled = item.disabled

            return (
              <div key={item.href} className="relative">
                {isDisabled ? (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 cursor-not-allowed">
                    {item.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant={isActive ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {isActive && <ArrowRight className="w-4 h-4" />}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={action.action}
              className="w-full justify-start"
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Status */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">System Status</span>
          </div>
          <p className="text-xs text-green-700">
            All social media integrations are operational
          </p>
          <div className="mt-2 text-xs text-green-600">
            <div>• OAuth services: Active</div>
            <div>• Notification system: Active</div>
            <div>• Publishing API: Active</div>
          </div>
        </div>

        {/* Integration Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Integration Status</h3>
          <div className="space-y-1 text-xs text-blue-700">
            <div className="flex justify-between">
              <span>Platforms:</span>
              <span>5 Available</span>
            </div>
            <div className="flex justify-between">
              <span>Features:</span>
              <span>Core Complete</span>
            </div>
            <div className="flex justify-between">
              <span>API Version:</span>
              <span>v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
