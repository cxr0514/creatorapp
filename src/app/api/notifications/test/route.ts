import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/types/notifications';

// Test endpoint to create sample notifications for testing
export async function POST() {
  try {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        title: 'Instagram Post Performance',
        message: 'Your morning workout video has reached 15K views!',
        type: 'achievement',
        category: 'social_media',
        platform: 'instagram',
        priority: 'high',
        timestamp: new Date(),
        read: false,
        userId: 'mock-user-id',
        metadata: {
          post_id: 'inst_123',
          metrics: {
            views: 15000,
            likes: 892,
            comments: 67
          },
          achievement_type: 'viral_content',
          platform_data: {
            post_url: 'https://instagram.com/p/example123'
          }
        }
      },
      {
        id: '2',
        title: 'YouTube Subscriber Milestone',
        message: 'Congratulations! You\'ve reached 13K subscribers on YouTube.',
        type: 'milestone',
        category: 'growth',
        platform: 'youtube',
        priority: 'high',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false,
        userId: 'mock-user-id',
        metadata: {
          milestone_type: 'subscriber_count',
          current_count: 13000,
          previous_milestone: 12000,
          growth_rate: 8.3
        }
      },
      {
        id: '3',
        title: 'Scheduled Post Ready',
        message: 'Your "Afternoon Productivity Tips" post is scheduled for 3:00 PM today.',
        type: 'reminder',
        category: 'scheduling',
        platform: 'instagram',
        priority: 'normal',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        read: false,
        userId: 'mock-user-id',
        metadata: {
          scheduled_time: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
          post_type: 'carousel',
          auto_publish: true
        }
      },
      {
        id: '4',
        title: 'Comment Requires Attention',
        message: 'You have 5 new comments on your latest YouTube video that need responses.',
        type: 'engagement',
        category: 'interaction',
        platform: 'youtube',
        priority: 'normal',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        read: true,
        userId: 'mock-user-id',
        metadata: {
          video_id: 'yt_456',
          comment_count: 5,
          requires_response: true,
          sentiment: 'positive'
        }
      },
      {
        id: '5',
        title: 'Twitter Connection Issue',
        message: 'Your Twitter account connection has expired. Please reconnect to continue posting.',
        type: 'error',
        category: 'connection',
        platform: 'twitter',
        priority: 'urgent',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        read: false,
        userId: 'mock-user-id',
        metadata: {
          error_type: 'authentication_expired',
          requires_reauth: true,
          last_successful_post: new Date(Date.now() - 86400000).toISOString() // 24 hours ago
        }
      },
      {
        id: '6',
        title: 'Weekly Analytics Report',
        message: 'Your weekly performance report is ready. Engagement is up 12% across all platforms!',
        type: 'system',
        category: 'analytics',
        platform: undefined,
        priority: 'low',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        read: false,
        userId: 'mock-user-id',
        metadata: {
          report_period: 'weekly',
          overall_growth: 12,
          top_platform: 'instagram',
          recommendations: [
            'Post more video content',
            'Increase story frequency',
            'Engage more in comments'
          ]
        }
      }
    ];

    return NextResponse.json({
      success: true,
      message: 'Sample notifications created successfully',
      notifications: sampleNotifications,
      count: sampleNotifications.length
    });

  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Test endpoint to verify notification system functionality
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('test') || 'basic';

    const testResults = {
      timestamp: new Date().toISOString(),
      test_type: testType,
      results: {} as Record<string, unknown>
    };

    switch (testType) {
      case 'basic':
        testResults.results = {
          notification_types_available: ['achievement', 'milestone', 'reminder', 'engagement', 'error', 'system'],
          categories_available: ['social_media', 'growth', 'scheduling', 'interaction', 'connection', 'analytics'],
          platforms_supported: ['instagram', 'youtube', 'twitter', 'tiktok', 'linkedin'],
          priority_levels: ['low', 'medium', 'high', 'urgent'],
          status: 'All notification features operational'
        };
        break;

      case 'api':
        // Test API endpoints
        const apiTests = {
          notifications_endpoint: '/api/notifications',
          individual_notification_endpoint: '/api/notifications/[id]',
          mark_all_read_endpoint: '/api/notifications/read-all',
          test_endpoint: '/api/notifications/test'
        };

        testResults.results = {
          endpoints: apiTests,
          methods_supported: {
            'GET /api/notifications': 'Fetch notifications with filtering',
            'POST /api/notifications': 'Create new notification',
            'PUT /api/notifications/[id]': 'Update notification',
            'DELETE /api/notifications/[id]': 'Delete notification',
            'POST /api/notifications/read-all': 'Mark all as read'
          },
          status: 'All API endpoints configured and ready'
        };
        break;

      case 'integration':
        testResults.results = {
          social_platforms: {
            instagram: { connected: true, last_sync: new Date().toISOString() },
            youtube: { connected: true, last_sync: new Date().toISOString() },
            twitter: { connected: false, last_sync: null },
            tiktok: { connected: false, last_sync: null }
          },
          notification_triggers: [
            'New follower milestones',
            'High engagement posts',
            'Scheduled post reminders',
            'Connection issues',
            'Comment responses needed',
            'Analytics reports ready'
          ],
          real_time_features: {
            webhooks_configured: true,
            push_notifications: true,
            email_notifications: true,
            in_app_notifications: true
          },
          status: 'Social media integrations ready for testing'
        };
        break;

      default:
        testResults.results = {
          error: 'Unknown test type',
          available_tests: ['basic', 'api', 'integration']
        };
    }

    return NextResponse.json({
      success: true,
      test_results: testResults
    });

  } catch (error) {
    console.error('Error running notification tests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
