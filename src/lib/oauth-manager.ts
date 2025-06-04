import { OAUTH_CONFIGS, generateOAuthUrl, exchangeCodeForToken, refreshAccessToken } from './oauth-config'
import { encrypt, decrypt } from './encryption'
import { prisma } from './prisma'

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  tokenType: string
}

export interface OAuthProfile {
  id: string
  username?: string
  name?: string
  email?: string
  profileImageUrl?: string
  [key: string]: unknown
}

export class OAuthManager {
  /**
   * Check if a platform is configured and supported
   */
  isPlatformConfigured(platform: string): boolean {
    return Object.keys(OAUTH_CONFIGS).includes(platform)
  }

  /**
   * Generate OAuth authorization URL for a platform
   */
  generateAuthUrl(platform: string, userId: string): string {
    const state = Buffer.from(JSON.stringify({ 
      userId, 
      timestamp: Date.now() 
    })).toString('base64')
    
    return generateOAuthUrl(platform, state)
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    platform: string, 
    code: string, 
    state: string
  ): Promise<{ tokens: OAuthTokens; profile: OAuthProfile }> {
    try {
      // Verify and decode state
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
      const { timestamp } = decodedState

      // Check if state is not too old (5 minutes)
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        throw new Error('OAuth state expired')
      }

      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken(platform, code)
      
      // Get user profile
      const profile = await this.getUserProfile(platform, tokenData.access_token)
      
      // Format tokens
      const tokens: OAuthTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000) 
          : undefined,
        tokenType: tokenData.token_type || 'Bearer'
      }

      return { tokens, profile }
    } catch (error) {
      console.error(`OAuth callback error for ${platform}:`, error)
      throw error
    }
  }

  /**
   * Get user profile from platform API
   */
  async getUserProfile(platform: string, accessToken: string): Promise<OAuthProfile> {
    const config = OAUTH_CONFIGS[platform]
    if (!config) {
      throw new Error(`Platform ${platform} not supported`)
    }

    let profileUrl: string
    let profileFields: string = ''

    switch (platform) {
      case 'youtube':
        profileUrl = 'https://www.googleapis.com/oauth2/v2/userinfo'
        break
      case 'instagram':
        profileUrl = 'https://graph.instagram.com/me'
        profileFields = '?fields=id,username,account_type,media_count'
        break
      case 'twitter':
        profileUrl = 'https://api.twitter.com/2/users/me'
        profileFields = '?user.fields=id,name,username,profile_image_url,public_metrics'
        break
      case 'tiktok':
        profileUrl = 'https://open.tiktokapis.com/v2/user/info/'
        profileFields = '?fields=open_id,union_id,avatar_url,display_name'
        break
      case 'linkedin':
        profileUrl = 'https://api.linkedin.com/v2/people/~'
        profileFields = ':(id,firstName,lastName,profilePicture(displayImage~:playableStreams))'
        break
      default:
        throw new Error(`Profile URL not configured for ${platform}`)
    }

    const response = await fetch(`${profileUrl}${profileFields}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch profile from ${platform}: ${response.statusText}`)
    }

    const profileData = await response.json()
    
    // Normalize profile data across platforms
    return this.normalizeProfile(platform, profileData)
  }

  /**
   * Normalize profile data across different platforms
   */
  private normalizeProfile(platform: string, profileData: Record<string, unknown>): OAuthProfile {
    const baseProfile: OAuthProfile = {
      id: '',
      username: '',
      name: '',
      email: '',
      profileImageUrl: ''
    }

    switch (platform) {
      case 'youtube':
        return {
          ...baseProfile,
          id: String(profileData.id || ''),
          name: String(profileData.name || ''),
          email: String(profileData.email || ''),
          profileImageUrl: String(profileData.picture || '')
        }
      
      case 'instagram':
        return {
          ...baseProfile,
          id: String(profileData.id || ''),
          username: String(profileData.username || ''),
          name: String(profileData.username || ''),
          accountType: profileData.account_type,
          mediaCount: profileData.media_count
        }
      
      case 'twitter':
        const userData = (profileData as Record<string, unknown>).data || profileData
        return {
          ...baseProfile,
          id: String((userData as Record<string, unknown>).id || ''),
          username: String((userData as Record<string, unknown>).username || ''),
          name: String((userData as Record<string, unknown>).name || ''),
          profileImageUrl: String((userData as Record<string, unknown>).profile_image_url || '')
        }
      
      case 'tiktok':
        const tiktokUser = (profileData as Record<string, unknown>).data as Record<string, unknown> || profileData
        return {
          ...baseProfile,
          id: String((tiktokUser as Record<string, unknown>).open_id || ''),
          username: String((tiktokUser as Record<string, unknown>).display_name || ''),
          name: String((tiktokUser as Record<string, unknown>).display_name || ''),
          profileImageUrl: String((tiktokUser as Record<string, unknown>).avatar_url || '')
        }
      
      case 'linkedin':
        const profileData_typed = profileData as Record<string, unknown>
        const firstNameObj = (profileData_typed.firstName as Record<string, unknown>)?.localized as Record<string, unknown>
        const lastNameObj = (profileData_typed.lastName as Record<string, unknown>)?.localized as Record<string, unknown>
        const firstName = String(firstNameObj?.en_US || '')
        const lastName = String(lastNameObj?.en_US || '')
        // Simplified profile image extraction - will be stored in metadata for complex structure
        return {
          ...baseProfile,
          id: String(profileData_typed.id || ''),
          name: `${firstName} ${lastName}`.trim(),
          profileImageUrl: '' // LinkedIn profile images have complex nested structure, store in metadata
        }
      
      default:
        const defaultProfileData = profileData as Record<string, unknown>
        return {
          ...baseProfile,
          id: String(defaultProfileData.id || defaultProfileData.user_id || ''),
          username: String(defaultProfileData.username || defaultProfileData.login || ''),
          name: String(defaultProfileData.name || defaultProfileData.display_name || ''),
          email: String(defaultProfileData.email || ''),
          profileImageUrl: String(defaultProfileData.avatar_url || defaultProfileData.profile_image_url || '')
        }
    }
  }

  /**
   * Store social account connection in database
   */
  async storeConnection(
    userId: string,
    platform: string,
    tokens: OAuthTokens,
    profile: OAuthProfile
  ): Promise<void> {
    try {
      // Encrypt sensitive tokens
      const encryptedAccessToken = await encrypt(tokens.accessToken)
      const encryptedRefreshToken = tokens.refreshToken 
        ? await encrypt(tokens.refreshToken) 
        : null

      // Store in database
      await prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId,
            platform
          }
        },
        update: {
          platformUserId: profile.id,
          platformUsername: profile.username || null,
          displayName: profile.name || null,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: tokens.expiresAt,
          isActive: true,
          lastUsedAt: new Date(),
          metadata: JSON.parse(JSON.stringify(profile))
        },
        create: {
          userId,
          platform,
          platformUserId: profile.id,
          platformUsername: profile.username || null,
          displayName: profile.name || null,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: tokens.expiresAt,
          isActive: true,
          lastUsedAt: new Date(),
          metadata: JSON.parse(JSON.stringify(profile))
        }
      })
    } catch (error) {
      console.error(`Failed to store ${platform} connection:`, error)
      throw error
    }
  }

  /**
   * Refresh expired access token
   */
  async refreshTokens(platform: string, refreshToken: string): Promise<OAuthTokens> {
    try {
      const tokenData = await refreshAccessToken(platform, refreshToken)
      
      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken,
        expiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000) 
          : undefined,
        tokenType: tokenData.token_type || 'Bearer'
      }
    } catch (error) {
      console.error(`Failed to refresh ${platform} tokens:`, error)
      throw error
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: string, platform: string): Promise<string | null> {
    try {
      const account = await prisma.socialAccount.findUnique({
        where: {
          userId_platform: {
            userId,
            platform
          }
        }
      })

      if (!account || !account.isActive) {
        return null
      }

      // Check if token is expired
      const now = new Date()
      const isExpired = account.tokenExpiresAt && account.tokenExpiresAt <= now

      if (isExpired && account.refreshToken) {
        // Refresh the token
        const decryptedRefreshToken = await decrypt(account.refreshToken)
        const newTokens = await this.refreshTokens(platform, decryptedRefreshToken)
        
        // Update in database
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: {
            accessToken: await encrypt(newTokens.accessToken),
            refreshToken: newTokens.refreshToken 
              ? await encrypt(newTokens.refreshToken) 
              : account.refreshToken,
            tokenExpiresAt: newTokens.expiresAt
          }
        })

        return newTokens.accessToken
      }

      // Return current token if not expired
      if (account.accessToken) {
        return await decrypt(account.accessToken)
      }
      
      return null
    } catch (error) {
      console.error(`Failed to get valid access token for ${platform}:`, error)
      return null
    }
  }

  /**
   * Disconnect social account
   */
  async disconnect(userId: string, platform: string): Promise<void> {
    await prisma.socialAccount.updateMany({
      where: {
        userId,
        platform
      },
      data: {
        isActive: false
      }
    })
  }
}

// Export singleton instance
export const oauthManager = new OAuthManager()