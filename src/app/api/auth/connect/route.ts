import { NextRequest, NextResponse } from 'next/server'
import { oauthManager } from '@/lib/oauth-manager'
import { cookies } from 'next/headers'

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

// Mock connection data for demo purposes
// In production, this would come from your database
const mockConnections: ConnectionStatus[] = [
  {
    platform: 'youtube',
    connected: false,
    health: 'healthy'
  },
  {
    platform: 'tiktok',
    connected: false,
    health: 'healthy'
  },
  {
    platform: 'instagram',
    connected: false,
    health: 'healthy'
  },
  {
    platform: 'twitter',
    connected: false,
    health: 'healthy'
  },
  {
    platform: 'linkedin',
    connected: false,
    health: 'healthy'
  }
]

export async function GET() {
  try {
    // In production, fetch from database based on authenticated user
    const cookieStore = await cookies()
    
    // Check for stored tokens to determine connection status
    const connections = mockConnections.map(conn => {
      const tokenCookie = cookieStore.get(`${conn.platform}_token`)
      const connected = !!tokenCookie?.value
      
      return {
        ...conn,
        connected,
        lastSync: connected ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
        tokenExpiry: connected ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
        analytics: connected ? {
          postsThisMonth: Math.floor(Math.random() * 20) + 5,
          avgEngagement: Math.floor(Math.random() * 15) + 5,
          lastPost: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        } : undefined
      }
    })

    return NextResponse.json({
      success: true,
      connections
    })
  } catch (error) {
    console.error('Error fetching connection statuses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connection statuses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platform, returnUrl } = await request.json()

    // Validate platform
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    if (!oauthManager.isPlatformConfigured(platform)) {
      return NextResponse.json(
        { error: `Platform '${platform}' is not configured or supported` },
        { status: 400 }
      )
    }

    // Generate state parameter for security (CSRF protection)
    const state = `${platform}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Store state and return URL in session/cookie for validation
    const response = NextResponse.json({
      authUrl: oauthManager.generateAuthUrl(platform, state),
      platform,
      state
    })

    // Store state in cookie for validation
    response.cookies.set(`oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10 // 10 minutes
    })

    if (returnUrl) {
      response.cookies.set(`oauth_return_${platform}`, returnUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 10 // 10 minutes
      })
    }

    return response

  } catch (error) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

// Get connection status for platforms
export async function DELETE(request: NextRequest) {
  try {
    const { platform } = await request.json()

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: `Disconnected from ${platform}`
    })

    // Remove all cookies for this platform
    response.cookies.delete(`${platform}_access_token`)
    response.cookies.delete(`${platform}_refresh_token`)
    response.cookies.delete(`${platform}_expires_at`)

    // Send notification
    await fetch(new URL('/api/notifications', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'info',
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Disconnected`,
        message: `Successfully disconnected your ${platform} account.`,
        platform: platform
      })
    })

    return response

  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    )
  }
}
