'use client'

import React from 'react'
import { SocialLayout } from '@/components/layouts/social-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SocialConnectionsEnhanced } from '@/components/dashboard/social-connections-enhanced'
import { 
  Zap, 
  TrendingUp, 
  Bell,
  BarChart3,
  MessageSquare,
  Heart,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe
} from 'lucide-react'

export default function SocialIntegrationTestPage() {
  const mockAnalytics = {
    totalPosts: 156,
    totalViews: 2340000,
    totalLikes: 45600,
    totalComments: 3420,
    totalShares: 8970,
    avgEngagement: 12.5,
    topPlatform: 'YouTube',
    recentPosts: [
      {
        id: '1',
        platform: 'youtube',
        title: 'How to Create Amazing Content',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        views: 15420,
        likes: 892,
        comments: 67,
        status: 'published'
      },
      {
        id: '2',
        platform: 'tiktok',
        title: 'Quick Creator Tips',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        views: 8756,
        likes: 1204,
        comments: 89,
        status: 'published'
      },
      {
        id: '3',
        platform: 'instagram',
        title: 'Behind the Scenes',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        views: 5643,
        likes: 543,
        comments: 32,
        status: 'published'
      }
    ]
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockNotifications = [
    {
      id: '1',
      type: 'success' as const,
      title: 'Video Published Successfully',
      message: 'Your video "Creating Amazing Content" was published to YouTube',
      platform: 'youtube',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      category: 'publishing' as const,
      priority: 'medium' as const,
      metadata: {
        publishStatus: 'published' as const,
        views: 1205,
        analytics: {
          likes: 89,
          comments: 12,
          shares: 23
        }
      }
    },
    {
      id: '2',
      type: 'warning' as const,
      title: 'Publishing Delayed',
      message: 'Your TikTok post has been delayed due to platform maintenance',
      platform: 'tiktok',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      category: 'publishing' as const,
      priority: 'high' as const,
      metadata: {
        publishStatus: 'pending' as const,
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }
    },
    {
      id: '3',
      type: 'info' as const,
      title: 'Analytics Update',
      message: 'Your content reached 10K views this week!',
      platform: 'youtube',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      category: 'analytics' as const,
      priority: 'low' as const,
      metadata: {
        views: 10000,
        engagement: 8.5,
        analytics: {
          likes: 750,
          comments: 95,
          shares: 140
        }
      }
    }
  ]

  const simulateNotification = async (type: 'success' | 'error' | 'warning' | 'info') => {
    const notifications = {
      success: {
        type: 'success',
        title: 'Content Published Successfully',
        message: 'Your video has been published to all selected platforms',
        platform: 'youtube',
        category: 'publishing',
        priority: 'medium',
        metadata: {
          publishStatus: 'published',
          views: Math.floor(Math.random() * 1000) + 100,
          analytics: {
            likes: Math.floor(Math.random() * 100) + 10,
            comments: Math.floor(Math.random() * 50) + 5,
            shares: Math.floor(Math.random() * 25) + 2
          }
        }
      },
      error: {
        type: 'error',
        title: 'Publishing Failed',
        message: 'Unable to publish to Instagram due to authentication error',
        platform: 'instagram',
        category: 'publishing',
        priority: 'urgent',
        metadata: {
          publishStatus: 'failed'
        }
      },
      warning: {
        type: 'warning',
        title: 'Token Expiring Soon',
        message: 'Your LinkedIn access token will expire in 24 hours',
        platform: 'linkedin',
        category: 'system',
        priority: 'high'
      },
      info: {
        type: 'info',
        title: 'Analytics Milestone',
        message: 'Congratulations! You reached 50K total views',
        category: 'analytics',
        priority: 'low',
        metadata: {
          views: 50000,
          engagement: 15.2
        }
      }
    }

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications[type])
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  return (
    <SocialLayout>
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Test Controls
          </CardTitle>
          <CardDescription>
            Simulate various scenarios to test the notification and integration system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => simulateNotification('success')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Success
            </Button>
            <Button 
              onClick={() => simulateNotification('error')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Error
            </Button>
            <Button 
              onClick={() => simulateNotification('warning')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Warning
            </Button>
            <Button 
              onClick={() => simulateNotification('info')}
              variant="outline"
            >
              <Bell className="w-4 h-4 mr-2" />
              Info
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAnalytics.totalPosts}</p>
                <p className="text-sm text-gray-600">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(mockAnalytics.totalViews / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(mockAnalytics.totalLikes / 1000).toFixed(1)}K</p>
                <p className="text-sm text-gray-600">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAnalytics.avgEngagement}%</p>
                <p className="text-sm text-gray-600">Avg Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Social Media Connections
          </CardTitle>
          <CardDescription>
            Test OAuth connections and publishing functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialConnectionsEnhanced />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest posts and their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="capitalize">
                    {post.platform}
                  </Badge>
                  <div>
                    <h4 className="font-medium text-gray-900">{post.title}</h4>
                    <p className="text-sm text-gray-600">
                      Published {post.publishedAt.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.likes.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {post.comments}
                  </span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {post.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Feature Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Core Features</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">OAuth Authentication</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Multi-platform Publishing</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Real-time Notifications</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Management</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Advanced Features</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Analytics Integration</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Demo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Scheduling</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Demo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bulk Operations</span>
                  <Badge variant="secondary">Planned</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Content Optimization</span>
                  <Badge variant="secondary">Planned</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SocialLayout>
  )
}
