# OAuth App Configuration Guide

## Phase 3 Production Setup - Social Media Platform OAuth Configuration

This guide provides step-by-step instructions for setting up OAuth applications on each social media platform to enable CreatorApp's publishing and scheduling features.

## Prerequisites

1. ✅ **Database Schema**: Updated with SocialAccount and ScheduledPost models
2. ✅ **Encryption System**: Implemented for secure token storage
3. ✅ **OAuth Callbacks**: Updated to use encryption and database storage
4. 🔄 **Environment Variables**: Need to be configured (see below)
5. 🔄 **OAuth Apps**: Need to be created on each platform

## Required Environment Variables

Copy the `.env.template` file to `.env.local` and configure these variables:

```bash
# Encryption
ENCRYPTION_KEY=your-generated-32-byte-encryption-key

# YouTube OAuth
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret

# Instagram OAuth  
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret

# Twitter/X OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# TikTok OAuth
TIKTOK_CLIENT_ID=your-tiktok-client-id
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
```

## Platform Setup Instructions

### 1. YouTube Data API v3

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create a new project or select existing one
3. **Enable YouTube Data API v3**:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "CreatorApp YouTube Integration"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/social/oauth/youtube/callback` (development)
     - `https://your-domain.com/api/social/oauth/youtube/callback` (production)
5. **Copy credentials** to `.env.local` as `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`

**Required Scopes**:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube.readonly`

### 2. Instagram Basic Display API

1. **Go to Meta for Developers**: https://developers.facebook.com/
2. **Create App**:
   - Click "Create App"
   - Use case: "Other"
   - App type: "Business"
3. **Add Instagram Basic Display**:
   - Go to app dashboard
   - Click "Add Product"
   - Find "Instagram Basic Display" and click "Set Up"
4. **Configure OAuth**:
   - Go to Instagram Basic Display > Basic Display
   - Add Instagram App ID and App Secret
   - Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/social/oauth/instagram/callback`
     - `https://your-domain.com/api/social/oauth/instagram/callback`
5. **Copy credentials** to `.env.local` as `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`

**Required Permissions**:
- `user_profile`
- `user_media`

### 3. Twitter/X API v2

1. **Go to Twitter Developer Portal**: https://developer.twitter.com/
2. **Create Project & App**:
   - Sign up for developer account
   - Create new project
   - Create new app within project
3. **Configure OAuth 2.0**:
   - Go to app settings
   - Enable OAuth 2.0
   - Callback URLs:
     - `http://localhost:3000/api/social/oauth/twitter/callback`
     - `https://your-domain.com/api/social/oauth/twitter/callback`
   - Website URL: Your app's URL
4. **Get API Keys**:
   - Copy Client ID and Client Secret
5. **Copy credentials** to `.env.local` as `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET`

**Required Scopes**:
- `tweet.read`
- `tweet.write`
- `users.read`

### 4. LinkedIn API

1. **Go to LinkedIn Developer Portal**: https://developer.linkedin.com/
2. **Create App**:
   - Click "Create App"
   - Fill in app details
   - Select company page (create if needed)
3. **Configure OAuth**:
   - Go to "Auth" tab
   - Add OAuth 2.0 redirect URLs:
     - `http://localhost:3000/api/social/oauth/linkedin/callback`
     - `https://your-domain.com/api/social/oauth/linkedin/callback`
4. **Request Products**:
   - Go to "Products" tab
   - Request "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect"
5. **Copy credentials** to `.env.local` as `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`

**Required Scopes**:
- `openid`
- `profile`
- `w_member_social`

### 5. TikTok for Developers

1. **Go to TikTok for Developers**: https://developers.tiktok.com/
2. **Create App**:
   - Register developer account
   - Create new app
   - Select "Login Kit" and "Content Posting API"
3. **Configure OAuth**:
   - Add redirect URLs:
     - `http://localhost:3000/api/social/oauth/tiktok/callback`
     - `https://your-domain.com/api/social/oauth/tiktok/callback`
4. **Copy credentials** to `.env.local` as `TIKTOK_CLIENT_ID` and `TIKTOK_CLIENT_SECRET`

**Required Scopes**:
- `user.info.basic`
- `video.upload`

## Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to your `.env.local` file as `ENCRYPTION_KEY`.

## Verification Steps

After setting up all OAuth apps:

1. **Test OAuth Flows**:
   ```bash
   npm run dev
   ```
   - Go to `/dashboard/social`
   - Try connecting each platform
   - Verify successful redirects and token storage

2. **Check Database**:
   - Verify `SocialAccount` records are created
   - Confirm tokens are encrypted
   - Check metadata is properly stored

3. **Test Publishing**:
   - Create a test post
   - Try immediate publishing
   - Test scheduled posting

## Common Issues

### 1. OAuth Redirect Mismatch
- **Error**: redirect_uri_mismatch
- **Solution**: Ensure redirect URIs in OAuth app settings exactly match the callback URLs

### 2. Scope Permissions
- **Error**: insufficient_scope
- **Solution**: Request additional scopes in the OAuth app configuration

### 3. Token Encryption
- **Error**: Encryption/decryption failures
- **Solution**: Verify `ENCRYPTION_KEY` is exactly 64 hex characters (32 bytes)

### 4. API Rate Limits
- **Error**: Rate limit exceeded
- **Solution**: Implement exponential backoff and respect platform rate limits

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Token Storage**: All tokens are encrypted using AES-256-GCM
3. **HTTPS**: Use HTTPS in production for secure OAuth flows
4. **Scope Minimization**: Only request necessary permissions
5. **Token Refresh**: Implement automatic token refresh for long-lived access

## Next Steps

1. ✅ Complete OAuth app setup for all platforms
2. ✅ Configure environment variables
3. ✅ Test OAuth flows
4. ✅ Verify publishing functionality
5. ✅ Set up production monitoring
6. ✅ Deploy to production environment

## Support Resources

- **YouTube API**: https://developers.google.com/youtube/v3
- **Instagram API**: https://developers.facebook.com/docs/instagram-basic-display-api
- **Twitter API**: https://developer.twitter.com/en/docs/api-reference-index
- **LinkedIn API**: https://docs.microsoft.com/en-us/linkedin/
- **TikTok API**: https://developers.tiktok.com/doc/
