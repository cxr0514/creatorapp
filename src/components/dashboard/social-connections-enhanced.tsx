'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlatformIcon } from '@/lib/platform-icons'

interface PlatformStatus {
  platform: string
  isConnected: boolean
  isExpired: boolean
  isConfigured: boolean
  username?: string
}

const PLATFORM_CONFIGS = [
  {
    id: 'youtube',
    displayName: 'YouTube',
    description: 'Share your videos with the world',
    maxFileSize: 128,
    maxDuration: 43200, // 12 hours
    supportedFormats: ['MP4', 'MOV', 'AVI', 'WMV'],
    supportsScheduling: true
  },
  {
    id: 'tiktok',
    displayName: 'TikTok',
    description: 'Create viral short-form content',
    maxFileSize: 72,
    maxDuration: 600, // 10 minutes
    supportedFormats: ['MP4', 'MOV'],
    supportsScheduling: false
  },
  {
    id: 'instagram',
    displayName: 'Instagram',
    description: 'Share photos and videos',
    maxFileSize: 100,
    maxDuration: 3600, // 60 minutes
    supportedFormats: ['MP4', 'MOV'],
    supportsScheduling: true
  },
  {
    id: 'twitter',
    displayName: 'X (Twitter)',
    description: 'Share thoughts and media',
    maxFileSize: 512,
    maxDuration: 140, // 2 minutes 20 seconds
    supportedFormats: ['MP4', 'MOV'],
    supportsScheduling: true
  },
  {
    id: 'linkedin',
    displayName: 'LinkedIn',
    description: 'Professional networking and content',
    maxFileSize: 200,
    maxDuration: 600, // 10 minutes
    supportedFormats: ['MP4', 'MOV', 'WMV'],
    supportsScheduling: true
  }
]

export function SocialConnectionsEnhanced() {
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    fetchConnectionStatus()
    
    // Check for OAuth callback results
    const urlParams = new URLSearchParams(window.location.search)
    const oauthSuccess = urlParams.get('oauth_success')
    const oauthError = urlParams.get('oauth_error')
    const platform = urlParams.get('platform')

    if (oauthSuccess === 'true' && platform) {
      // Refresh connection status after successful OAuth
      setTimeout(fetchConnectionStatus, 1000)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (oauthError && platform) {
      console.error(`OAuth error for ${platform}:`, oauthError)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/auth/connect')
      if (response.ok) {
        const data = await response.json()
        setPlatformStatuses(data.platforms || [])
      }
    } catch (error) {
      console.error('Error fetching connection status:', error)
      // Fallback to default status
      setPlatformStatuses(PLATFORM_CONFIGS.map(platform => ({
        platform: platform.id,
        isConnected: false,
        isExpired: false,
        isConfigured: false
      })))
    } finally {
      setLoading(false)
    }
  }

  const connectPlatform = async (platformId: string) => {
    setConnecting(platformId)
    try {
      const response = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform: platformId,
          returnUrl: window.location.href
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Redirect to OAuth authorization URL
        window.location.href = data.authUrl
      } else {
        const error = await response.json()
        console.error('OAuth initiation failed:', error)
        alert(`Failed to connect ${platformId}: ${error.error}`)
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
      alert(`Error connecting ${platformId}. Please try again.`)
    } finally {
      setConnecting(null)
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
        await fetchConnectionStatus()
      } else {
        const error = await response.json()
        console.error('Disconnect failed:', error)
        alert(`Failed to disconnect ${platformId}: ${error.error}`)
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
      alert(`Error disconnecting ${platformId}. Please try again.`)
    }
  }

  const getPlatformColor = (platformId: string) => {
    switch (platformId) {
      case 'youtube':
        return 'from-red-500 to-red-600'
      case 'tiktok':
        return 'from-black to-gray-800'
      case 'instagram':
        return 'from-purple-500 via-pink-500 to-orange-400'
      case 'twitter':
        return 'from-blue-400 to-blue-500'
      case 'linkedin':
        return 'from-blue-600 to-blue-700'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Social Media Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const connectedCount = platformStatuses.filter(p => p.isConnected && !p.isExpired).length
  const connectionPercentage = Math.round((connectedCount / PLATFORM_CONFIGS.length) * 100)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Connections</h2>
          <p className="text-gray-600 mt-1">Connect your social media accounts to publish content directly</p>
        </div>
        <Button
          onClick={fetchConnectionStatus}
          variant="outline"
          size="sm"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATFORM_CONFIGS.map((platform) => {
          const status = platformStatuses.find(s => s.platform === platform.id)
          const isConnected = status?.isConnected && !status?.isExpired
          const isConnecting = connecting === platform.id
          const isConfigured = status?.isConfigured ?? false

          return (
            <div key={platform.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getPlatformColor(platform.id)} rounded-full flex items-center justify-center relative`}>
                    <PlatformIcon platformId={platform.id} size="md" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.displayName}</h3>
                    <p className="text-sm text-gray-600">{platform.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 
                        status?.isExpired ? 'bg-yellow-500' : 
                        'bg-gray-300'
                      }`}></div>
                      <span className={`text-xs font-medium ${
                        isConnected ? 'text-green-600' : 
                        status?.isExpired ? 'text-yellow-600' : 
                        'text-gray-500'
                      }`}>
                        {isConnected ? 'Connected' : 
                         status?.isExpired ? 'Token Expired' : 
                         'Not connected'}
                      </span>
                      {!isConfigured && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          Not configured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  {isConnected ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => disconnectPlatform(platform.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => connectPlatform(platform.id)}
                      disabled={isConnecting || !isConfigured}
                      className={`${
                        isConfigured 
                          ? `bg-gradient-to-r ${getPlatformColor(platform.id)} hover:opacity-90 text-white`
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isConnecting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {isConfigured ? 'Connect' : 'Configure First'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Platform Details */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Max file size:</span>
                    <span className="ml-1 font-medium">{platform.maxFileSize}MB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max duration:</span>
                    <span className="ml-1 font-medium">{Math.floor(platform.maxDuration / 60)}min</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Supported formats:</span>
                    <span className="ml-1 font-medium">{platform.supportedFormats.join(', ')}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Scheduling:</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        platform.supportsScheduling 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {platform.supportsScheduling ? 'Supported' : 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Connection Status Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Connection Status</h3>
            <p className="text-gray-600 mt-1">
              {connectedCount} of {PLATFORM_CONFIGS.length} platforms connected
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {connectionPercentage}%
            </div>
            <div className="text-sm text-gray-600">Connected</div>
          </div>
        </div>
        
        {connectedCount === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Get started:</strong> Connect at least one social media account to begin publishing your content directly from CreatorApp.
            </p>
          </div>
        )}

        {/* Configuration Help */}
        {platformStatuses.filter(p => !p.isConfigured).length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Setup Required:</strong> Some platforms need API credentials in your environment variables. 
              Check the .env.local file for required settings.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
