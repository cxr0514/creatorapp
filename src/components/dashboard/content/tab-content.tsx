'use client'

import { VideoUpload } from '../video-upload-enhanced'
import { VideoList } from '../video-list'
import { ClipList } from '../clip-list'
import { SocialConnections } from '../social-connections'
import { CalendarWidget } from '../../calendar/calendar-widget'
import { WorkflowBuilder } from '../workflow-builder'
import { AnalyticsDashboard } from '../analytics-dashboard-refactored'
import { AIMetadataEnhancer } from '../ai-metadata-enhancer'
import { BatchAIProcessor } from '../batch-ai-processor'
import { EnhancedDashboard } from '../enhanced-dashboard'
import { AdvancedAnalytics } from '../advanced-analytics'
import { MobileDashboard } from '../mobile-dashboard'
import AdminDashboard from '../../admin/AdminDashboard'
import PricingPlans from '../../subscription/PricingPlans'
import WorkspaceManagement from '../../workspace/WorkspaceManagement'
import SupportTickets from '../../support/SupportTickets'
import SystemMonitoring from '../../admin/SystemMonitoring'
import { DashboardStats } from '../widgets/dashboard-stats'
import { Button } from '@/components/ui/button'
import { ConnectYouTubeButton, VideoAnalyticsCard } from '@/components/youtube'
import { ProfilePage } from '@/components/dashboard/profile/profile-page'
import { 
  CloudArrowUpIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface CalendarScheduledPost {
  id: string
  videoId: number
  platform: string
  scheduledTime: Date
  status: 'pending' | 'published' | 'failed'
  title: string
  thumbnailUrl?: string
}

interface ScheduledPost {
  id: string
  title: string
  platform: string
  scheduledDate: string
  status: 'draft' | 'scheduled' | 'published'
}

interface Platform {
  id: string
  name: string
  connected: boolean
  username?: string
}

interface Session {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

interface TabContentProps {
  activeTab: string
  refreshKey: number
  showVideoUpload: boolean
  setShowVideoUpload: (show: boolean) => void
  handleUploadComplete: () => void
  scheduledPosts: ScheduledPost[]
  handlePostSelect: (post: ScheduledPost) => void
  handleScheduleNew: (date: Date) => void
  platforms: Platform[]
  isMobile: boolean
  session: Session
}

export function TabContent({
  activeTab,
  refreshKey,
  showVideoUpload,
  setShowVideoUpload,
  handleUploadComplete,
  scheduledPosts,
  handlePostSelect,
  handleScheduleNew,
  platforms: _platforms, // eslint-disable-line @typescript-eslint/no-unused-vars
  isMobile,
  session
}: TabContentProps) {
  // Sample data for dashboard components
  const mobileStats = [
    {
      title: 'Total Views',
      value: '12.4K',
      change: '+18%',
      trend: 'up' as const,
      icon: EyeIcon,
      color: 'text-blue-500'
    },
    {
      title: 'Engagement',
      value: '8.2%',
      change: '+5%',
      trend: 'up' as const,
      icon: HeartIcon,
      color: 'text-red-500'
    },
    {
      title: 'Shares',
      value: '342',
      change: '+23%',
      trend: 'up' as const,
      icon: ShareIcon,
      color: 'text-green-500'
    },
    {
      title: 'Watch Time',
      value: '2.1h',
      change: '+12%',
      trend: 'up' as const,
      icon: ClockIcon,
      color: 'text-purple-500'
    }
  ]

  const quickActions = [
    {
      title: 'Upload Video',
      description: 'Add new content to your library',
      icon: CloudArrowUpIcon,
      color: 'from-primary to-primary/80',
      action: () => setShowVideoUpload(true),
      onClick: () => setShowVideoUpload(true)
    },
    {
      title: 'Schedule Post',
      description: 'Plan your content calendar',
      icon: CalendarIcon,
      color: 'from-accent-warning to-accent-warning/80',
      action: () => console.log('Schedule post'),
      onClick: () => console.log('Schedule post')
    },
    {
      title: 'View Analytics',
      description: 'Track your performance',
      icon: ChartBarIcon,
      color: 'from-accent-info to-accent-info/80',
      action: () => console.log('View analytics'),
      onClick: () => console.log('View analytics')
    }
  ]

  const contentItems = [
    {
      id: '1',
      title: 'My First Video',
      platform: 'YouTube',
      views: 1250,
      thumbnail: '/placeholder-thumbnail.jpg',
      status: 'published' as const,
      publishDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'TikTok Dance',
      platform: 'TikTok',
      views: 5600,
      thumbnail: '/placeholder-thumbnail.jpg',
      status: 'scheduled' as const,
      publishDate: '2024-01-20'
    }
  ]

  const stats = [
    {
      name: 'Total Views',
      value: '12.4K',
      change: '+18%',
      icon: EyeIcon,
      color: 'text-blue-500'
    },
    {
      name: 'Engagement',
      value: '8.2%',
      change: '+5%',
      icon: HeartIcon,
      color: 'text-red-500'
    },
    {
      name: 'Shares',
      value: '342',
      change: '+23%',
      icon: ShareIcon,
      color: 'text-green-500'
    }
  ]

  const recentMetrics = [
    {
      name: 'Watch Time',
      value: '2.1h',
      icon: ClockIcon,
      trend: '+12%'
    },
    {
      name: 'Subscribers',
      value: '1.2K',
      icon: UserGroupIcon,
      trend: '+8%'
    }
  ]

  // Helper function to convert ScheduledPost to CalendarScheduledPost
  const convertToCalendarPosts = (posts: ScheduledPost[]): CalendarScheduledPost[] => {
    return posts.map(post => ({
      id: post.id,
      videoId: parseInt(post.id), // Convert string id to number for videoId
      platform: post.platform,
      scheduledTime: new Date(post.scheduledDate),
      status: post.status === 'scheduled' ? 'pending' as const : 
              post.status === 'published' ? 'published' as const : 'failed' as const,
      title: post.title,
      thumbnailUrl: undefined
    }))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isMobile ? (
          <MobileDashboard 
            stats={mobileStats}
            quickActions={quickActions}
            contentItems={contentItems}
            userName={session?.user?.name || 'User'}
            onMenuToggle={() => console.log('Menu toggle')}
            onRefresh={() => console.log('Refresh')}
            onCreateContent={() => setShowVideoUpload(true)}
          />
        ) : (
          <>
            <DashboardStats />
            <EnhancedDashboard 
              stats={stats}
              recentMetrics={recentMetrics}
              quickActions={quickActions}
              userName={session?.user?.name || 'User'}
            />
          </>
        )

      case 'uploads':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-foreground">Video Library</h1>
              <Button onClick={() => setShowVideoUpload(true)}>
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            </div>
            {showVideoUpload && (
              <div className="mb-6">
                <VideoUpload
                  onUploadComplete={handleUploadComplete}
                />
              </div>
            )}
            <VideoList key={refreshKey} onUploadClick={() => setShowVideoUpload(true)} />
          </div>
        )

      case 'clips':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-foreground">Clips</h1>
            </div>
            <ClipList />
          </div>
        )

      case 'ai':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <AIMetadataEnhancer />
              </div>
              <div>
                <BatchAIProcessor
                  items={[]}
                  onComplete={(results) => {
                    console.log('Batch processing completed:', results)
                  }}
                />
              </div>
            </div>
          </div>
        )

      case 'calendar':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CalendarWidget
                  scheduledPosts={convertToCalendarPosts(scheduledPosts)}
                  onDateSelect={(date) => console.log('Date selected:', date)}
                  onPostSelect={(post) => {
                    // Convert back to original type for handler
                    const originalPost: ScheduledPost = {
                      id: post.id,
                      title: post.title,
                      platform: post.platform,
                      scheduledDate: post.scheduledTime.toISOString(),
                      status: post.status === 'pending' ? 'scheduled' : 
                              post.status === 'published' ? 'published' : 'draft'
                    }
                    handlePostSelect(originalPost)
                  }}
                  onScheduleNew={handleScheduleNew}
                />
              </div>
              <div>
                <SocialConnections />
              </div>
            </div>
          </div>
        )

      case 'analytics':
        return isMobile ? (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-foreground">Analytics</h1>
            <AdvancedAnalytics timeRange="7d" />
            
            {/* YouTube Analytics Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">YouTube Analytics</h2>
              <ConnectYouTubeButton />
              <VideoAnalyticsCard 
                videoId="dQw4w9WgXcQ" 
                title="Sample Video Analytics" 
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnalyticsDashboard />
            <AdvancedAnalytics timeRange="30d" />
            
            {/* YouTube Analytics Section */}
            <div className="space-y-6">
              <div className="border-t pt-6">
                <h2 className="text-2xl font-bold mb-4">YouTube Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Connect YouTube</h3>
                    <ConnectYouTubeButton />
                    <p className="text-sm text-muted-foreground">
                      Connect your YouTube account to access detailed analytics and performance metrics.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Video Analytics</h3>
                    <VideoAnalyticsCard 
                      videoId="dQw4w9WgXcQ" 
                      title="Sample Video Performance" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'workflows':
        return <WorkflowBuilder />

      case 'workspaces':
        return <WorkspaceManagement />

      case 'support':
        return <SupportTickets />

      case 'admin':
        return <AdminDashboard />

      case 'monitor':
        return <SystemMonitoring />

      case 'subscription':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
            <PricingPlans />
          </div>
        )

      case 'profile':
        return <ProfilePage />

      default:
        return <DashboardStats />
    }
  }

  return (
    <main className="flex-1 relative overflow-y-auto focus:outline-none">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {renderTabContent()}
        </div>
      </div>
    </main>
  )
}
