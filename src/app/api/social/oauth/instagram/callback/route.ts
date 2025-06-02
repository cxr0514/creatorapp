import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { exchangeCodeForToken } from '@/lib/oauth-config'
import { encrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

// Instagram OAuth callback
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
      console.error('Instagram OAuth error:', error)
      return NextResponse.redirect('/dashboard/social?error=oauth_error')
    }

    if (!code) {
      return NextResponse.redirect('/dashboard/social?error=missing_code')
    }

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken('instagram', code)

      // Get user profile from Instagram Basic Display API
      const profileResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`)
      
      const profileData = await profileResponse.json()

      if (!profileData.id) {
        return NextResponse.redirect('/dashboard/social?error=no_user_profile')
      }

      // Save to database with encrypted tokens
      await prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: 'instagram'
          }
        },
        update: {
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: profileData.id,
          platformUsername: profileData.username,
          displayName: profileData.username,
          isActive: true,
          lastUsedAt: new Date(),
          metadata: {
            accountType: profileData.account_type,
            mediaCount: profileData.media_count
          }
        },
        create: {
          userId: session.user.id,
          platform: 'instagram',
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: profileData.id,
          platformUsername: profileData.username,
          displayName: profileData.username,
          permissions: ['upload', 'schedule'],
          metadata: {
            accountType: profileData.account_type,
            mediaCount: profileData.media_count
          }
        }
      })

      console.log('Instagram OAuth success:', {
        userId: profileData.id,
        username: profileData.username,
        accountType: profileData.account_type
      })

      return NextResponse.redirect('/dashboard/social?success=instagram_connected')
    } catch (tokenError) {
      console.error('Error exchanging Instagram OAuth code:', tokenError)
      return NextResponse.redirect('/dashboard/social?error=token_exchange_failed')
    }
  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return NextResponse.redirect('/dashboard/social?error=callback_error')
  }
}
