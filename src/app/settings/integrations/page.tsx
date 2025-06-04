'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Link, 
  Unlink, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Bell,
  Shield,
  Zap,
  TrendingUp,
  Globe
} from 'lucide-react'
import { PlatformIcon, getAllPlatformConfigs } from '@/lib/platform-icons'

interface ConnectionStatus {
  platform: string
  connected: boolean
  lastSync?: Date
  tokenExpiry?: Date
  permissions?: string[]
  health: 'healthy' | 'warning' | 'error'
  analytics?: {
    postsThisMonth: number
    avgEngagement: number
    lastPost?: Date
  }
}

interface NotificationSettings {
  platform: string
  enabled: boolean
  publishSuccess: boolean
  publishFailed: boolean
  analytics: boolean
  mentions: boolean
  comments: boolean
  scheduledPosts: boolean
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<ConnectionStatus[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  const platforms = getAllPlatformConfigs()

  const loadConnectionStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/connect')
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Error loading connection statuses:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadNotificationSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotificationSettings(data.settings || platforms.map(p => ({
          platform: p.id,
          enabled: true,
          publishSuccess: true,
          publishFailed: true,
          analytics: true,
          mentions: false,
          comments: false,
          scheduledPosts: true
        })))
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
      // Set defaults
      setNotificationSettings(platforms.map(p => ({
        platform: p.id,
        enabled: true,
        publishSuccess: true,
        publishFailed: true,
        analytics: true,
        mentions: false,
        comments: false,
        scheduledPosts: true
      })))
    }
  }, [platforms])

  useEffect(() => {
    loadConnectionStatuses()
    loadNotificationSettings()
  }, [loadConnectionStatuses, loadNotificationSettings])

  const connectPlatform = async (platformId: string) => {
    try {
      const response = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.authUrl) {
          window.open(data.authUrl, '_blank', 'width=500,height=600')
        }
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
    }
  }

  const disconnectPlatform = async (platformId: string) => {
    try {
      const response = await fetch('/api/auth/connect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId })
      })
      
      if (response.ok) {
        setConnections(prev => 
          prev.map(conn => 
            conn.platform === platformId 
              ? { ...conn, connected: false } 
              : conn
          )
        )
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
    }
  }

  const syncPlatform = async (platformId: string) => {
    setSyncing(platformId)
    try {
      const response = await fetch(`/api/sync/${platformId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadConnectionStatuses()
      }
    } catch (error) {
      console.error('Error syncing platform:', error)
    } finally {
      setSyncing(null)
    }
  }

  const updateNotificationSetting = async (platformId: string, setting: keyof NotificationSettings, value: boolean) => {
    try {
      const updated = notificationSettings.map(ns =>
        ns.platform === platformId ? { ...ns, [setting]: value } : ns
      )
      setNotificationSettings(updated)

      await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated })
      })
    } catch (error) {
      console.error('Error updating notification setting:', error)
    }
  }

  const getConnectionStatus = (platformId: string): ConnectionStatus | undefined => {
    return connections.find(conn => conn.platform === platformId)
  }

  const getNotificationSetting = (platformId: string): NotificationSettings | undefined => {
    return notificationSettings.find(ns => ns.platform === platformId)
  }

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Warning</Badge>
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Integrations</h1>
          <p className="text-gray-600 mt-1">Manage your connected platforms and notification preferences</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Link className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connections.filter(c => c.connected).length}</p>
                <p className="text-sm text-gray-600">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connections.filter(c => c.health === 'healthy').length}</p>
                <p className="text-sm text-gray-600">Healthy</p>
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
                <p className="text-2xl font-bold">
                  {connections.reduce((acc, c) => acc + (c.analytics?.postsThisMonth || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Posts This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(connections.reduce((acc, c) => acc + (c.analytics?.avgEngagement || 0), 0) / connections.length || 0)}%
                </p>
                <p className="text-sm text-gray-600">Avg. Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Platform Connections
          </CardTitle>
          <CardDescription>
            Connect your social media accounts to enable cross-platform publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {platforms.map((platform) => {
            const connection = getConnectionStatus(platform.id)
            const isConnected = connection?.connected || false

            return (
              <div key={platform.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <PlatformIcon platformId={platform.id} size="lg" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.displayName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {isConnected ? (
                        <>
                          {getHealthBadge(connection?.health || 'unknown')}
                          {connection?.lastSync && (
                            <span className="text-sm text-gray-500">
                              Last sync: {new Date(connection.lastSync).toLocaleString()}
                            </span>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary">Not Connected</Badge>
                      )}
                    </div>
                    
                    {connection?.analytics && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{connection.analytics.postsThisMonth} posts this month</span>
                        <span>{connection.analytics.avgEngagement}% avg engagement</span>
                        {connection.analytics.lastPost && (
                          <span>Last post: {new Date(connection.analytics.lastPost).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncPlatform(platform.id)}
                      disabled={syncing === platform.id}
                    >
                      {syncing === platform.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Sync
                    </Button>
                  )}
                  
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectPlatform(platform.id)}
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => connectPlatform(platform.id)}
                      size="sm"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure which notifications you want to receive for each platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {platforms.map((platform) => {
              const settings = getNotificationSetting(platform.id)
              const isConnected = getConnectionStatus(platform.id)?.connected || false

              if (!settings) return null

              return (
                <div key={platform.id} className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <PlatformIcon platformId={platform.id} size="md" />
                    <h3 className="font-semibold text-gray-900">{platform.displayName}</h3>
                    {!isConnected && (
                      <Badge variant="secondary" className="text-xs">Not Connected</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-8">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Publishing Success</label>
                      <Switch
                        checked={settings.publishSuccess}
                        onCheckedChange={(checked) => 
                          updateNotificationSetting(platform.id, 'publishSuccess', checked)
                        }
                        disabled={!isConnected}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Publishing Failed</label>
                      <Switch
                        checked={settings.publishFailed}
                        onCheckedChange={(checked) => 
                          updateNotificationSetting(platform.id, 'publishFailed', checked)
                        }
                        disabled={!isConnected}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Analytics Updates</label>
                      <Switch
                        checked={settings.analytics}
                        onCheckedChange={(checked) => 
                          updateNotificationSetting(platform.id, 'analytics', checked)
                        }
                        disabled={!isConnected}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Scheduled Posts</label>
                      <Switch
                        checked={settings.scheduledPosts}
                        onCheckedChange={(checked) => 
                          updateNotificationSetting(platform.id, 'scheduledPosts', checked)
                        }
                        disabled={!isConnected}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Manage data access and security settings for your integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Automatic Token Refresh</h4>
              <p className="text-sm text-gray-600">Automatically refresh expired access tokens</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Data Encryption</h4>
              <p className="text-sm text-gray-600">Encrypt stored access tokens and user data</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Usage Analytics</h4>
              <p className="text-sm text-gray-600">Allow anonymous usage analytics to improve the service</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
