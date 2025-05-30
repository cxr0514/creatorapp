'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  Cog6ToothIcon,
  PlusIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

interface SocialPlatform {
  id: string
  name: string
  icon: string
  connected: boolean
  username?: string
  followerCount?: string
  bgColor: string
  iconColor: string
}

export function SocialConnections() {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      connected: false,
      bgColor: 'bg-black',
      iconColor: 'text-white'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      connected: false,
      bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
      iconColor: 'text-white'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '🎥',
      connected: false,
      bgColor: 'bg-red-600',
      iconColor: 'text-white'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👥',
      connected: false,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white'
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: '🐦',
      connected: false,
      bgColor: 'bg-black',
      iconColor: 'text-white'
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: '📦',
      connected: false,
      bgColor: 'bg-blue-500',
      iconColor: 'text-white'
    }
  ])

  const handleConnect = (platformId: string) => {
    // In a real app, this would trigger OAuth flow
    setPlatforms(prev => prev.map(platform => 
      platform.id === platformId 
        ? { 
            ...platform, 
            connected: true,
            username: `@user_${platform.id}`,
            followerCount: Math.floor(Math.random() * 10000).toLocaleString()
          }
        : platform
    ))
  }

  const handleDisconnect = (platformId: string) => {
    setPlatforms(prev => prev.map(platform => 
      platform.id === platformId 
        ? { 
            ...platform, 
            connected: false,
            username: undefined,
            followerCount: undefined
          }
        : platform
    ))
  }

  const connectedCount = platforms.filter(p => p.connected).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Social Media Connections</h1>
        <p className="mt-1 text-sm text-gray-600">
          Connect your social media accounts to streamline content publishing and automation.
        </p>
      </div>

      {/* Status Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Connection Status</h3>
            <p className="mt-1 text-sm text-gray-500">
              {connectedCount} of {platforms.length} platforms connected
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1">
              {platforms.slice(0, 4).map((platform) => (
                <div
                  key={platform.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ring-2 ring-white ${platform.bgColor} ${platform.iconColor}`}
                >
                  {platform.icon}
                </div>
              ))}
              {platforms.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white">
                  +{platforms.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-900">{Math.round((connectedCount / platforms.length) * 100)}%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(connectedCount / platforms.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Platform Connections */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <LinkIcon className="h-5 w-5 text-purple-600 mr-2" />
            Available Platforms
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {platforms.map((platform) => (
            <div key={platform.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg ${platform.bgColor} ${platform.iconColor}`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{platform.name}</h4>
                    {platform.connected ? (
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">{platform.username}</p>
                        <p className="text-xs text-gray-500">{platform.followerCount} followers</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not connected</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {platform.connected ? (
                    <>
                      <div className="flex items-center text-green-600">
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(platform.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600"
                      >
                        <Cog6ToothIcon className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
              
              {platform.connected && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Publishing permissions</span>
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Post content
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Schedule posts
                      </span>
                      <Button variant="ghost" size="sm" className="text-purple-600">
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button className="relative block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
            <div className="flex flex-col items-center">
              <div className="mx-auto h-8 w-8 text-gray-400 mb-2">🔗</div>
              <span className="block text-sm font-medium text-gray-900">Connect All</span>
              <span className="block text-xs text-gray-500 mt-1">Bulk connect accounts</span>
            </div>
          </button>
          
          <button className="relative block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
            <div className="flex flex-col items-center">
              <div className="mx-auto h-8 w-8 text-gray-400 mb-2">⚙️</div>
              <span className="block text-sm font-medium text-gray-900">Sync Settings</span>
              <span className="block text-xs text-gray-500 mt-1">Update all permissions</span>
            </div>
          </button>
          
          <button className="relative block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">
            <div className="flex flex-col items-center">
              <div className="mx-auto h-8 w-8 text-gray-400 mb-2">📊</div>
              <span className="block text-sm font-medium text-gray-900">View Analytics</span>
              <span className="block text-xs text-gray-500 mt-1">Cross-platform insights</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-purple-900 mb-2">💡 Pro Tips</h3>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Connect all platforms now to streamline future content publishing</li>
          <li>• Each platform may have different content format requirements</li>
          <li>• You can always disconnect and reconnect accounts as needed</li>
          <li>• Settings are saved automatically when you make changes</li>
        </ul>
      </div>
    </div>
  )
}
