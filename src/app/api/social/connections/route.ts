import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateOAuthUrl } from '@/lib/oauth-config'
import { prisma } from '@/lib/prisma'

// GET /api/social/connections - Get user's connected social accounts
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get actual connected accounts from database
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        platformUsername: true,
        displayName: true,
        permissions: true,
        lastUsedAt: true,
        tokenExpiresAt: true,
        metadata: true
      }
    })

    // Define all supported platforms
    const supportedPlatforms = ['youtube', 'tiktok', 'instagram', 'twitter', 'linkedin']
    
    // Create connections array with both connected and unconnected platforms
    const connections = supportedPlatforms.map(platform => {
      const account = socialAccounts.find(acc => acc.platform === platform)
      
      if (account) {
        return {
          id: account.id,
          platform: account.platform,
          accountId: account.platformUserId,
          accountName: account.displayName || account.platformUsername,
          username: account.platformUsername,
          isConnected: true,
          permissions: account.permissions || [],
          lastUsedAt: account.lastUsedAt,
          tokenExpiration: account.tokenExpiresAt,
          metadata: account.metadata
        }
      } else {
        return {
          id: `unconnected-${platform}`,
          platform,
          accountId: null,
          accountName: `Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
          isConnected: false,
          permissions: platform === 'linkedin' ? ['upload'] : ['upload', 'schedule']
        }
      }
    })

    return NextResponse.json({ connections })
  } catch (error) {
    console.error('Error fetching social connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social connections' },
      { status: 500 }
    )
  }
}

// POST /api/social/connections - Connect a social account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await request.json()
    // TODO: Use redirectUrl when implementing real OAuth flows
    // const { platform, redirectUrl } = await request.json()

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
    }

    try {
      // Generate real OAuth URL with state parameter for security
      const state = Buffer.from(JSON.stringify({ 
        userId: session.user.id, 
        timestamp: Date.now() 
      })).toString('base64')
      
      const authUrl = generateOAuthUrl(platform, state)
      
      return NextResponse.json({ 
        authUrl,
        message: `Starting OAuth flow for ${platform}`
      })
    } catch (error) {
      console.error('Error generating OAuth URL:', error)
      return NextResponse.json({ error: 'Platform not supported or configuration missing' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error connecting social account:', error)
    return NextResponse.json(
      { error: 'Failed to connect social account' },
      { status: 500 }
    )
  }
}

// DELETE /api/social/connections/[id] - Disconnect a social account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const connectionId = url.pathname.split('/').pop()

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
    }

    // Find and delete the social account
    const deletedAccount = await prisma.socialAccount.deleteMany({
      where: {
        id: connectionId,
        userId: session.user.id
      }
    })

    if (deletedAccount.count === 0) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Social account disconnected successfully'
    })
  } catch (error) {
    console.error('Error disconnecting social account:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect social account' },
      { status: 500 }
    )
  }
}
