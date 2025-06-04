'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { NotificationCenter } from '@/components/dashboard/notification-center';
import { SocialConnectionsEnhanced } from '@/components/dashboard/social-connections-enhanced';
import { SocialLayout } from '@/components/layouts/social-layout';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart, 
  Share, 
  Instagram, 
  Youtube, 
  Twitter,
  Calendar,
  BarChart3,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Notification } from '@/types/notifications';

interface AnalyticsData {
  platform: string;
  followers: number;
  engagement: number;
  posts: number;
  reach: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change: number;
}

interface ContentPerformance {
  id: string;
  title: string;
  platform: string;
  type: 'video' | 'image' | 'story' | 'post';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  published_at: string;
}

interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  scheduled_time: string;
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  content_type: 'video' | 'image' | 'carousel' | 'text';
}

export default function DashboardIntegrationsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load notifications
      const notificationsRes = await fetch('/api/notifications');
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.notifications || []);
      }

      // Mock analytics data (in real app, this would come from API)
      setAnalyticsData([
        {
          platform: 'Instagram',
          followers: 25400,
          engagement: 8.5,
          posts: 142,
          reach: 89000,
          icon: Instagram,
          color: 'bg-gradient-to-r from-purple-500 to-pink-500',
          change: 12.5
        },
        {
          platform: 'YouTube',
          followers: 12800,
          engagement: 15.2,
          posts: 45,
          reach: 156000,
          icon: Youtube,
          color: 'bg-red-500',
          change: 8.3
        },
        {
          platform: 'Twitter',
          followers: 8900,
          engagement: 6.8,
          posts: 89,
          reach: 45000,
          icon: Twitter,
          color: 'bg-blue-500',
          change: -2.1
        }
      ]);

      // Mock content performance data
      setContentPerformance([
        {
          id: '1',
          title: 'Morning Workout Routine',
          platform: 'Instagram',
          type: 'video',
          views: 15400,
          likes: 892,
          comments: 67,
          shares: 23,
          engagement_rate: 6.4,
          published_at: '2024-01-09T08:30:00Z'
        },
        {
          id: '2',
          title: 'Healthy Breakfast Ideas',
          platform: 'YouTube',
          type: 'video',
          views: 28900,
          likes: 1205,
          comments: 89,
          shares: 156,
          engagement_rate: 5.2,
          published_at: '2024-01-08T06:15:00Z'
        },
        {
          id: '3',
          title: 'Weekend Motivation',
          platform: 'Twitter',
          type: 'post',
          views: 5600,
          likes: 234,
          comments: 18,
          shares: 45,
          engagement_rate: 5.3,
          published_at: '2024-01-07T12:00:00Z'
        }
      ]);

      // Mock scheduled posts
      setScheduledPosts([
        {
          id: '1',
          title: 'Afternoon Productivity Tips',
          platform: 'Instagram',
          scheduled_time: '2024-01-10T15:00:00Z',
          status: 'scheduled',
          content_type: 'carousel'
        },
        {
          id: '2',
          title: 'Weekly Fitness Challenge',
          platform: 'YouTube',
          scheduled_time: '2024-01-11T18:00:00Z',
          status: 'pending',
          content_type: 'video'
        },
        {
          id: '3',
          title: 'Mindfulness Monday',
          platform: 'Twitter',
          scheduled_time: '2024-01-11T09:00:00Z',
          status: 'scheduled',
          content_type: 'text'
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <SocialLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SocialLayout>
    );
  }

  return (
    <SocialLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Social Media Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage all your social media integrations and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect New Platform
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Followers</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(analyticsData.reduce((sum, data) => sum + data.followers, 0))}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+8.2% this month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                      <p className="text-2xl font-bold">
                        {(analyticsData.reduce((sum, data) => sum + data.engagement, 0) / analyticsData.length).toFixed(1)}%
                      </p>
                    </div>
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+2.1% this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Posts</p>
                      <p className="text-2xl font-bold">
                        {analyticsData.reduce((sum, data) => sum + data.posts, 0)}
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+15 this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reach</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(analyticsData.reduce((sum, data) => sum + data.reach, 0))}
                      </p>
                    </div>
                    <Share className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.5% this month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Platform Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.map((platform) => {
                    const IconComponent = platform.icon;
                    return (
                      <div key={platform.platform} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platform.color}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{platform.platform}</p>
                            <p className="text-sm text-gray-600">{formatNumber(platform.followers)} followers</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{platform.engagement}%</p>
                          <p className={`text-sm ${platform.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {platform.change >= 0 ? '+' : ''}{platform.change}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <NotificationCenter />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.map((platform) => (
                      <div key={platform.platform} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{platform.platform}</span>
                          <span className="text-sm text-gray-600">{platform.engagement}%</span>
                        </div>
                        <Progress value={platform.engagement} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Follower Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.map((platform) => (
                      <div key={platform.platform} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platform.color}`}>
                            <platform.icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">{platform.platform}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatNumber(platform.followers)}</p>
                          <p className={`text-sm ${platform.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {platform.change >= 0 ? '+' : ''}{platform.change}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentPerformance.map((content) => (
                    <div key={content.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{content.title}</h3>
                          <Badge variant="secondary">{content.platform}</Badge>
                          <Badge variant="outline">{content.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Published {formatDate(content.published_at)}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-sm font-medium">{formatNumber(content.views)}</p>
                          <p className="text-xs text-gray-600">Views</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{formatNumber(content.likes)}</p>
                          <p className="text-xs text-gray-600">Likes</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{content.comments}</p>
                          <p className="text-xs text-gray-600">Comments</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{content.engagement_rate}%</p>
                          <p className="text-xs text-gray-600">Engagement</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Scheduled Posts</h2>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule New Post
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(post.status)}
                        <div>
                          <h3 className="font-medium">{post.title}</h3>
                          <p className="text-sm text-gray-600">
                            {post.platform} • {formatDate(post.scheduled_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{post.content_type}</Badge>
                        <Badge 
                          variant={post.status === 'scheduled' ? 'default' : post.status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {post.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-6">
            <SocialConnectionsEnhanced />
          </TabsContent>
        </Tabs>
      </div>
    </SocialLayout>
  );
}
