// OAuth configuration for social media platforms
// This file contains the OAuth settings and endpoints for each platform

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  redirectUri: string
}

export interface PlatformConfig {
  oauth: OAuthConfig
  apiBaseUrl: string
  rateLimit: {
    requests: number
    window: number // in seconds
  }
}

// Platform OAuth configurations
export const OAUTH_CONFIGS: Record<string, PlatformConfig> = {
  youtube: {
    oauth: {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      redirectUri: process.env.NEXTAUTH_URL + '/api/social/oauth/youtube/callback'
    },
    apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
    rateLimit: {
      requests: 10000,
      window: 86400 // 24 hours
    }
  },

  tiktok: {
    oauth: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      scopes: [
        'user.info.basic',
        'video.upload',
        'video.publish'
      ],
      redirectUri: process.env.NEXTAUTH_URL + '/api/social/oauth/tiktok/callback'
    },
    apiBaseUrl: 'https://open.tiktokapis.com',
    rateLimit: {
      requests: 1000,
      window: 86400 // 24 hours
    }
  },

  instagram: {
    oauth: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      scopes: [
        'user_profile',
        'user_media',
        'instagram_content_publish'
      ],
      redirectUri: process.env.NEXTAUTH_URL + '/api/social/oauth/instagram/callback'
    },
    apiBaseUrl: 'https://graph.instagram.com',
    rateLimit: {
      requests: 4800,
      window: 3600 // 1 hour
    }
  },

  twitter: {
    oauth: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: [
        'tweet.read',
        'tweet.write',
        'users.read',
        'offline.access'
      ],
      redirectUri: process.env.NEXTAUTH_URL + '/api/social/oauth/twitter/callback'
    },
    apiBaseUrl: 'https://api.twitter.com/2',
    rateLimit: {
      requests: 300,
      window: 900 // 15 minutes
    }
  },

  linkedin: {
    oauth: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: [
        'r_liteprofile',
        'w_member_social',
        'w_organization_social'
      ],
      redirectUri: process.env.NEXTAUTH_URL + '/api/social/oauth/linkedin/callback'
    },
    apiBaseUrl: 'https://api.linkedin.com/v2',
    rateLimit: {
      requests: 500,
      window: 86400 // 24 hours
    }
  }
}

// Generate OAuth authorization URL
export function generateOAuthUrl(platform: string, state?: string): string {
  const config = OAUTH_CONFIGS[platform]
  if (!config) {
    throw new Error(`Platform ${platform} not supported`)
  }

  const params = new URLSearchParams({
    client_id: config.oauth.clientId,
    redirect_uri: config.oauth.redirectUri,
    scope: config.oauth.scopes.join(' '),
    response_type: 'code',
    access_type: 'offline', // For refresh tokens
    ...(state && { state })
  })

  return `${config.oauth.authUrl}?${params.toString()}`
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  platform: string,
  code: string
): Promise<{
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
}> {
  const config = OAUTH_CONFIGS[platform]
  if (!config) {
    throw new Error(`Platform ${platform} not supported`)
  }

  const body = new URLSearchParams({
    client_id: config.oauth.clientId,
    client_secret: config.oauth.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.oauth.redirectUri
  })

  const response = await fetch(config.oauth.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token: ${response.statusText}`)
  }

  return response.json()
}

// Refresh access token
export async function refreshAccessToken(
  platform: string,
  refreshToken: string
): Promise<{
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
}> {
  const config = OAUTH_CONFIGS[platform]
  if (!config) {
    throw new Error(`Platform ${platform} not supported`)
  }

  const body = new URLSearchParams({
    client_id: config.oauth.clientId,
    client_secret: config.oauth.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })

  const response = await fetch(config.oauth.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`)
  }

  return response.json()
}
