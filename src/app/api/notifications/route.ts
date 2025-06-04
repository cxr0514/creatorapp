import { NextRequest, NextResponse } from 'next/server'
import { Notification } from '@/types/notifications'

// Enhanced notifications data with all new features
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'mock-user-id',
    type: 'success' as const,
    title: 'Video Published Successfully',
    message: 'Your video "5 AI Tools for Content Creators" has been published to YouTube.',
    platform: 'youtube',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    actionUrl: 'https://youtube.com/watch?v=example123',
    category: 'publishing' as const,
    priority: 'normal' as const,
    contentType: 'video' as const,
    metadata: {
      postId: 'yt_post_123',
      views: 1247,
      engagement: 8.5,
      publishStatus: 'published' as const,
      analytics: {
        likes: 89,
        comments: 12,
        shares: 23,
        impressions: 1500
      }
    }
  },
  {
    id: '2',
    userId: 'mock-user-id',
    type: 'info' as const,
    title: 'Content Scheduled Successfully',
    message: 'Your TikTok video has been scheduled for tomorrow at 3:00 PM.',
    platform: 'tiktok',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    read: false,
    category: 'publishing' as const,
    priority: 'low' as const,
    contentType: 'video' as const,
    metadata: {
      postId: 'tk_sched_456',
      publishStatus: 'scheduled' as const,
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: '3',
    userId: 'mock-user-id',
    type: 'success' as const,
    title: 'Analytics Milestone Reached',
    message: 'Your Instagram post reached 10,000 views! Engagement is up 25%.',
    platform: 'instagram',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
    actionUrl: 'https://instagram.com/p/example456',
    category: 'analytics' as const,
    priority: 'normal' as const,
    contentType: 'image' as const,
    metadata: {
      postId: 'ig_post_789',
      views: 10247,
      engagement: 12.3,
      publishStatus: 'published' as const,
      analytics: {
        likes: 543,
        comments: 67,
        shares: 89,
        impressions: 12500
      }
    }
  },
  {
    id: '4',
    userId: 'mock-user-id',
    type: 'warning' as const,
    title: 'Publishing Delayed',
    message: 'Your LinkedIn post was delayed due to platform maintenance. Will retry in 30 minutes.',
    platform: 'linkedin',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    read: false,
    category: 'publishing' as const,
    priority: 'high' as const,
    contentType: 'text' as const,
    metadata: {
      postId: 'li_post_101',
      publishStatus: 'pending' as const,
      scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }
  },
  {
    id: '5',
    userId: 'mock-user-id',
    type: 'error' as const,
    title: 'Authentication Error',
    message: 'Twitter connection expired. Please reconnect your account to continue publishing.',
    platform: 'twitter',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: false,
    actionUrl: '/settings/integrations',
    category: 'system' as const,
    priority: 'urgent' as const,
    metadata: {
      publishStatus: 'failed' as const
    }
  },
  {
    id: '6',
    type: 'info' as const,
    title: 'Weekly Report Ready',
    message: 'Your weekly analytics report is ready. Total reach: 45.2K across all platforms.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: false,
    category: 'analytics' as const,
    priority: 'low' as const,
    userId: 'mock-user-id',
    metadata: {
      views: 45200,
      engagement: 9.8,
      analytics: {
        likes: 2341,
        comments: 189,
        shares: 456,
        impressions: 52000
      }
    }
  }
]

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    let filteredNotifications = [...mockNotifications]

    // Filter by category
    if (category && category !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.category === category)
    }

    // Filter by read status
    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.read)
    }

    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply limit
    filteredNotifications = filteredNotifications.slice(0, limit)

    const unreadCount = mockNotifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: filteredNotifications,
      unreadCount,
      total: filteredNotifications.length
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const { type, title, message, platform, actionUrl, category, priority, contentType, metadata } = await request.json()

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      )
    }

    const newNotification: Notification = {
      id: Date.now().toString(),
      userId: 'mock-user-id', // In production, get from authenticated user
      type,
      title,
      message,
      platform,
      timestamp: new Date(),
      read: false,
      actionUrl,
      category: category || 'system',
      priority: priority || 'normal',
      contentType,
      metadata
    }

    // Add to the beginning of the array (newest first)
    mockNotifications.unshift(newNotification)

    // Keep only the latest 100 notifications
    if (mockNotifications.length > 100) {
      mockNotifications.splice(100)
    }

    return NextResponse.json({
      success: true,
      notification: newNotification
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Clear all notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category && category !== 'all') {
      // Remove notifications by category
      const initialLength = mockNotifications.length
      for (let i = mockNotifications.length - 1; i >= 0; i--) {
        if (mockNotifications[i].category === category) {
          mockNotifications.splice(i, 1)
        }
      }
      const removedCount = initialLength - mockNotifications.length

      return NextResponse.json({
        success: true,
        message: `Removed ${removedCount} notifications from category: ${category}`
      })
    } else {
      // Clear all notifications
      const removedCount = mockNotifications.length
      mockNotifications.splice(0)

      return NextResponse.json({
        success: true,
        message: `Removed ${removedCount} notifications`
      })
    }
  } catch (error) {
    console.error('Error clearing notifications:', error)
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    )
  }
}
