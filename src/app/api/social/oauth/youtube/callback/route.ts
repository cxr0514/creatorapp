import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { exchangeCodeForToken } from '@/lib/oauth-config'
import { encrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

// YouTube OAuth callback
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.redirect('/auth/signin')
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('YouTube OAuth error:', error)
      return NextResponse.redirect('/dashboard/social?error=oauth_error')
    }

    if (!code) {
      return NextResponse.redirect('/dashboard/social?error=missing_code')
    }

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken('youtube', code, state || undefined)

      // Get channel statistics for additional metadata
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      })

      const channelData = await channelResponse.json()
      const channel = channelData.items?.[0]

      if (!channel) {
        return NextResponse.redirect('/dashboard/social?error=no_channel')
      }

      // Save to database with encrypted tokens
      await prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: 'youtube'
          }
        },
        update: {
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: channel.id,
          platformUsername: channel.snippet.customUrl || channel.snippet.title,
          displayName: channel.snippet.title,
          isActive: true,
          lastUsedAt: new Date(),
          metadata: {
            subscriberCount: channel.statistics?.subscriberCount,
            videoCount: channel.statistics?.videoCount,
            thumbnailUrl: channel.snippet.thumbnails?.default?.url
          }
        },
        create: {
          userId: session.user.id,
          platform: 'youtube',
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: channel.id,
          platformUsername: channel.snippet.customUrl || channel.snippet.title,
          displayName: channel.snippet.title,
          permissions: ['upload', 'schedule'],
          metadata: {
            subscriberCount: channel.statistics?.subscriberCount,
            videoCount: channel.statistics?.videoCount,
            thumbnailUrl: channel.snippet.thumbnails?.default?.url
          }
        }
      })

      console.log('YouTube OAuth success:', {
        channelId: channel.id,
        channelTitle: channel.snippet.title,
        hasRefreshToken: !!tokenData.refresh_token
      })

      return NextResponse.redirect('/dashboard/social?success=youtube_connected')
    } catch (tokenError) {
      console.error('Error exchanging YouTube OAuth code:', tokenError)
      return NextResponse.redirect('/dashboard/social?error=token_exchange_failed')
    }
  } catch (error) {
    console.error('YouTube OAuth callback error:', error)
    return NextResponse.redirect('/dashboard/social?error=callback_error')
  }
}
