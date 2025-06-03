'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SocialIcon } from '@/components/ui/social-icon'
import { 
  SOCIAL_PLATFORMS, 
  type SocialAccount 
} from '@/lib/social-publishing'

export function SocialConnections() {
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
        setConnectedAccounts(data.connections)
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
        alert(`OAuth flow would start: ${data.authUrl}`)
        
        // For demo purposes, simulate successful connection
        setTimeout(() => {
          setConnectedAccounts(prev => 
            prev.map(acc => 
              acc.platform === platformId 
                ? { ...acc, isConnected: true, accountName: `Your ${SOCIAL_PLATFORMS.find(p => p.id === platformId)?.displayName}` }
                : acc
            )
          )
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
              ? { ...acc, isConnected: false, accountName: `Connect your ${SOCIAL_PLATFORMS.find(p => p.id === acc.platform)?.displayName}` }
              : acc
          )
        )
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
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
        <h2 className="text-2xl font-bold text-card-foreground">Social Media Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-3 bg-accent rounded w-32"></div>
                </div>
                <div className="w-20 h-8 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Social Media Connections</h2>
          <p className="text-muted-foreground mt-1">Connect your social media accounts to publish content directly</p>
        </div>
        <Button
          onClick={fetchConnectedAccounts}
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
        {SOCIAL_PLATFORMS.map((platform) => {
          const account = connectedAccounts.find(acc => acc.platform === platform.id)
          const isConnected = account?.isConnected || false
          const isConnecting = connecting === platform.id

          return (
            <div key={platform.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getPlatformColor(platform.id)} rounded-full flex items-center justify-center text-white p-2`}>
                    <SocialIcon platform={platform.id} size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{platform.displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? account?.accountName : `Connect your ${platform.displayName} account`}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-muted'}`}></div>
                      <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {isConnected ? 'Connected' : 'Not connected'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  {isConnected ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => disconnectPlatform(account?.id || '')}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        Disconnect
                      </Button>
                      <div className="text-xs text-muted-foreground text-center">
                        {account?.permissions.join(', ')}
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => connectPlatform(platform.id)}
                      disabled={isConnecting}
                      className={`bg-gradient-to-r ${getPlatformColor(platform.id)} hover:opacity-90 text-white`}
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
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Platform Details */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Max file size:</span>
                    <span className="ml-1 font-medium">{platform.maxFileSize}MB</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max duration:</span>
                    <span className="ml-1 font-medium">{Math.floor(platform.maxDuration / 60)}min</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Supported formats:</span>
                    <span className="ml-1 font-medium">{platform.supportedFormats.join(', ')}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Scheduling:</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        platform.supportsScheduling 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-accent text-accent-foreground'
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
            <h3 className="font-semibold text-card-foreground">Connection Status</h3>
            <p className="text-muted-foreground mt-1">
              {connectedAccounts.filter(acc => acc.isConnected).length} of {SOCIAL_PLATFORMS.length} platforms connected
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((connectedAccounts.filter(acc => acc.isConnected).length / SOCIAL_PLATFORMS.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Connected</div>
          </div>
        </div>
        
        {connectedAccounts.filter(acc => acc.isConnected).length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Get started:</strong> Connect at least one social media account to begin publishing your content directly from CreatorApp.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
