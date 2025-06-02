import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { exchangeCodeForToken } from '@/lib/oauth-config'
import { encrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

// TikTok OAuth callback
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.redirect('/auth/signin')
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('TikTok OAuth error:', error)
      return NextResponse.redirect('/dashboard/social?error=oauth_error')
    }

    if (!code) {
      return NextResponse.redirect('/dashboard/social?error=missing_code')
    }

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken('tiktok', code)

      // Get user profile from TikTok API
      const profileResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      })

      const profileData = await profileResponse.json()
      const user = profileData.data?.user

      if (!user) {
        return NextResponse.redirect('/dashboard/social?error=no_user_profile')
      }

      // Save to database with encrypted tokens
      await prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: 'tiktok'
          }
        },
        update: {
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: user.open_id,
          platformUsername: user.username,
          displayName: user.display_name,
          isActive: true,
          lastUsedAt: new Date(),
          metadata: {
            avatarUrl: user.avatar_url,
            followerCount: user.follower_count,
            followingCount: user.following_count,
            likesCount: user.likes_count,
            videoCount: user.video_count
          }
        },
        create: {
          userId: session.user.id,
          platform: 'tiktok',
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: user.open_id,
          platformUsername: user.username,
          displayName: user.display_name,
          permissions: ['upload', 'schedule'],
          metadata: {
            avatarUrl: user.avatar_url,
            followerCount: user.follower_count,
            followingCount: user.following_count,
            likesCount: user.likes_count,
            videoCount: user.video_count
          }
        }
      })

      console.log('TikTok OAuth success:', {
        userId: user.open_id,
        username: user.username,
        displayName: user.display_name
      })

      return NextResponse.redirect('/dashboard/social?success=tiktok_connected')
    } catch (tokenError) {
      console.error('Error exchanging TikTok OAuth code:', tokenError)
      return NextResponse.redirect('/dashboard/social?error=token_exchange_failed')
    }
  } catch (error) {
    console.error('TikTok OAuth callback error:', error)
    return NextResponse.redirect('/dashboard/social?error=callback_error')
  }
}
