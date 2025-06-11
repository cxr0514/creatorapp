'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LinkIcon, 
  CheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface SocialAccount {
  id: string
  platform: string
  username: string
  isConnected: boolean
  avatarUrl?: string
  followerCount?: number
  lastSync?: string
}

const SOCIAL_PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube',
    color: 'bg-red-500',
    icon: '▶️'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    icon: '📷'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: 'bg-black',
    icon: '🎵'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    color: 'bg-blue-500',
    icon: '🐦'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: 'bg-blue-600',
    icon: '👥'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: 'bg-blue-700',
    icon: '💼'
  }
]

export function SocialMediaTab() {
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    fetchConnectedAccounts()
  }, [])

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch('/api/social/connections')
      if (response.ok) {
        const data = await response.json()
        setConnectedAccounts(data.connections || [])
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectPlatform = async (platformId: string) => {
    setConnecting(platformId)
    try {
      const response = await fetch('/api/social/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId })
      })
      
      if (response.ok) {
        const data = await response.json()
        // In a real implementation, this would redirect to OAuth
        console.log(`OAuth flow would start: ${data.authUrl}`)
        
        // For demo purposes, simulate successful connection
        setTimeout(() => {
          const newAccount: SocialAccount = {
            id: `${platformId}_${Date.now()}`,
            platform: platformId,
            username: `@user_${platformId}`,
            isConnected: true,
            followerCount: Math.floor(Math.random() * 10000),
            lastSync: new Date().toISOString()
          }
          
          setConnectedAccounts(prev => {
            const existing = prev.find(acc => acc.platform === platformId)
            if (existing) {
              return prev.map(acc =>
                acc.platform === platformId 
                  ? { ...acc, isConnected: true }
                  : acc
              )
            }
            return [...prev, newAccount]
          })
          setConnecting(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
      setConnecting(null)
    }
  }

  const disconnectPlatform = async (accountId: string) => {
    try {
      const response = await fetch(`/api/social/connections/${accountId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConnectedAccounts(prev =>
          prev.map(acc =>
            acc.id === accountId
              ? { ...acc, isConnected: false }
              : acc
          )
        )
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
    }
  }

  const getPlatformInfo = (platformId: string) => {
    return SOCIAL_PLATFORMS.find(p => p.id === platformId) || {
      id: platformId,
      name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
      color: 'bg-gray-500',
      icon: '🔗'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckIcon className="w-5 h-5 text-green-500" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectedAccounts.filter(acc => acc.isConnected).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No social media accounts connected yet</p>
              <p className="text-sm">Connect your accounts below to start cross-posting</p>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedAccounts
                .filter(account => account.isConnected)
                .map(account => {
                  const platform = getPlatformInfo(account.platform)
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg`}>
                          {platform.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{platform.name}</h3>
                          <p className="text-sm text-muted-foreground">{account.username}</p>
                          {account.followerCount && (
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(account.followerCount)} followers
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectPlatform(account.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
            Available Platforms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOCIAL_PLATFORMS
              .filter(platform => 
                !connectedAccounts.some(acc => 
                  acc.platform === platform.id && acc.isConnected
                )
              )
              .map(platform => (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white`}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{platform.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your {platform.name} account
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => connectPlatform(platform.id)}
                    disabled={connecting === platform.id}
                    size="sm"
                  >
                    {connecting === platform.id ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Cross-Posting Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Posting Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Auto-publish to all connected platforms</h3>
              <p className="text-sm text-muted-foreground">
                Automatically share new content across all connected accounts
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Platform-specific formatting</h3>
              <p className="text-sm text-muted-foreground">
                Customize content format for each platform
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Settings
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Scheduled posting</h3>
              <p className="text-sm text-muted-foreground">
                Plan and schedule your cross-platform content
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
