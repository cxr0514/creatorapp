import { NextRequest, NextResponse } from 'next/server'
import { oauthManager } from '@/lib/oauth-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const { platform } = await params

  try {
    // Handle OAuth errors
    if (error) {
      console.error(`OAuth error for ${platform}:`, error)
      return NextResponse.redirect(
        new URL(`/dashboard?oauth_error=${encodeURIComponent(error)}&platform=${platform}`, request.url)
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/dashboard?oauth_error=missing_parameters&platform=${platform}`, request.url)
      )
    }

    // Validate platform
    if (!oauthManager.isPlatformConfigured(platform)) {
      return NextResponse.redirect(
        new URL(`/dashboard?oauth_error=unsupported_platform&platform=${platform}`, request.url)
      )
    }

    try {
      // Exchange code for access token and get user profile
      const { tokens, profile } = await oauthManager.handleCallback(platform, code, state)
      
      // TODO: Store profile information and tokens in database associated with current user
      console.log(`Successfully connected ${platform} account for user:`, profile.name || profile.username)
      
      // Create response with success redirect
      const response = NextResponse.redirect(
        new URL(`/dashboard?oauth_success=true&platform=${platform}`, request.url)
      )

      // Store tokens in httpOnly cookies (more secure than localStorage)
      response.cookies.set(`${platform}_access_token`, tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })

      if (tokens.refreshToken) {
        response.cookies.set(`${platform}_refresh_token`, tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
      }

      if (tokens.expiresAt) {
        response.cookies.set(`${platform}_expires_at`, tokens.expiresAt.toISOString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
      }

      // Send success notification
      await fetch(new URL('/api/notifications', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'success',
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Connected`,
          message: `Successfully connected your ${platform} account. You can now publish content to this platform.`,
          platform: platform
        })
      })

      return response

    } catch (tokenError) {
      console.error(`Token exchange error for ${platform}:`, tokenError)
      
      // Send error notification
      await fetch(new URL('/api/notifications', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Connection Failed`,
          message: `Failed to connect your ${platform} account. Please try again.`,
          platform: platform
        })
      })

      return NextResponse.redirect(
        new URL(`/dashboard?oauth_error=token_exchange_failed&platform=${platform}`, request.url)
      )
    }

  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error)
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=callback_error&platform=${platform}`, request.url)
    )
  }
}
