import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { exchangeCodeForToken } from '@/lib/oauth-config'
import { encrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

// LinkedIn OAuth callback
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
      console.error('LinkedIn OAuth error:', error)
      return NextResponse.redirect('/dashboard/social?error=oauth_error')
    }

    if (!code) {
      return NextResponse.redirect('/dashboard/social?error=missing_code')
    }

    try {
      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken('linkedin', code, state || undefined)

      // Get user profile from LinkedIn API
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      })

      const profileData = await profileResponse.json()

      if (!profileData.sub) {
        return NextResponse.redirect('/dashboard/social?error=no_user_profile')
      }

      // Save to database with encrypted tokens
      await prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: 'linkedin'
          }
        },
        update: {
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: profileData.sub,
          platformUsername: profileData.email || profileData.name,
          displayName: profileData.name,
          isActive: true,
          lastUsedAt: new Date(),
          metadata: {
            email: profileData.email,
            picture: profileData.picture,
            locale: profileData.locale
          }
        },
        create: {
          userId: session.user.id,
          platform: 'linkedin',
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
          platformUserId: profileData.sub,
          platformUsername: profileData.email || profileData.name,
          displayName: profileData.name,
          permissions: ['post', 'schedule'],
          metadata: {
            email: profileData.email,
            picture: profileData.picture,
            locale: profileData.locale
          }
        }
      })

      console.log('LinkedIn OAuth success:', {
        userId: profileData.sub,
        name: profileData.name,
        email: profileData.email
      })

      return NextResponse.redirect('/dashboard/social?success=linkedin_connected')
    } catch (tokenError) {
      console.error('Error exchanging LinkedIn OAuth code:', tokenError)
      return NextResponse.redirect('/dashboard/social?error=token_exchange_failed')
    }
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error)
    return NextResponse.redirect('/dashboard/social?error=callback_error')
  }
}
