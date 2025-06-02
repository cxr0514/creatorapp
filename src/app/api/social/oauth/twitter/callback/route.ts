import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { exchangeCodeForToken } from '@/lib/oauth-config'
import { encrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

// Twitter/X OAuth callback
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
      console.error('Twitter OAuth error:', error)
      return NextResponse.redirect('/dashboard/social?error=oauth_error')
    }

    if (!code) {
      return NextResponse.redirect('/dashboard/social?error=missing_code')
    }

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken('twitter', code)

      // Get user profile from Twitter API v2
      const profileResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,public_metrics', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      })

      const profileData = await profileResponse.json()
      const user = profileData.data

      if (!user) {
        return NextResponse.redirect('/dashboard/social?error=no_user_profile')
      }

      // Save to database with encrypted tokens
      await prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: 'twitter'
          }
        },
        update: {
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: user.id,
          platformUsername: user.username,
          displayName: user.name,
          isActive: true,
          lastUsedAt: new Date(),
          metadata: {
            profileImageUrl: user.profile_image_url,
            followersCount: user.public_metrics?.followers_count,
            followingCount: user.public_metrics?.following_count,
            tweetCount: user.public_metrics?.tweet_count
          }
        },
        create: {
          userId: session.user.id,
          platform: 'twitter',
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: user.id,
          platformUsername: user.username,
          displayName: user.name,
          permissions: ['tweet', 'schedule'],
          metadata: {
            profileImageUrl: user.profile_image_url,
            followersCount: user.public_metrics?.followers_count,
            followingCount: user.public_metrics?.following_count,
            tweetCount: user.public_metrics?.tweet_count
          }
        }
      })

      console.log('Twitter OAuth success:', {
        userId: user.id,
        username: user.username,
        name: user.name,
        followers: user.public_metrics?.followers_count
      })

      return NextResponse.redirect('/dashboard/social?success=twitter_connected')
    } catch (tokenError) {
      console.error('Error exchanging Twitter OAuth code:', tokenError)
      return NextResponse.redirect('/dashboard/social?error=token_exchange_failed')
    }
  } catch (error) {
    console.error('Twitter OAuth callback error:', error)
    return NextResponse.redirect('/dashboard/social?error=callback_error')
  }
}
