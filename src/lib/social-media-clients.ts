import { google } from 'googleapis'
import { TwitterApi } from 'twitter-api-v2'
import axios from 'axios'

// Types for social media posts
export interface SocialMediaPost {
  id: string
  platform: string
  title?: string
  description: string
  videoUrl?: string
  thumbnailUrl?: string
  tags?: string[]
  scheduledFor?: Date
  publishedAt?: Date
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  analytics?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
    engagement?: number
  }
}

export interface PublishResponse {
  success: boolean
  postId?: string
  url?: string
  error?: string
  scheduledFor?: Date
}

interface NotificationData {
  title: string
  message: string
  platform: string
  postId?: string
  actionUrl?: string
  views?: number
  engagement?: number
}

interface InstagramInsight {
  name: string
  values: Array<{ value: number }>
}

interface TweetData {
  text: string
  media?: { 
    media_ids: [string] | [string, string] | [string, string, string] | [string, string, string, string]
  }
}

// YouTube API Client
export class YouTubeClient {
  private youtube: ReturnType<typeof google.youtube> | null = null

  constructor() {
    if (process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
      const auth = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI
      )
      
      this.youtube = google.youtube({ version: 'v3', auth })
    } else {
      this.youtube = null
    }
  }

  async publishVideo(accessToken: string, post: SocialMediaPost): Promise<PublishResponse> {
    try {
      if (!this.youtube) {
        throw new Error('YouTube client not configured')
      }

      // Set access token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.youtube as any).auth.setCredentials({ access_token: accessToken })

      // In a real implementation, you would upload the video file here
      // For now, we'll simulate the response
      const mockResponse = {
        id: `yt_${Date.now()}`,
        snippet: {
          publishedAt: new Date().toISOString()
        }
      }

      await this.sendNotification('success', {
        title: 'Video Published to YouTube',
        message: `"${post.title}" has been successfully published.`,
        platform: 'youtube',
        postId: mockResponse.id,
        actionUrl: `https://youtube.com/watch?v=${mockResponse.id}`
      })

      return {
        success: true,
        postId: mockResponse.id,
        url: `https://youtube.com/watch?v=${mockResponse.id}`
      }
    } catch (error) {
      console.error('YouTube publish error:', error)
      
      await this.sendNotification('error', {
        title: 'YouTube Publish Failed',
        message: `Failed to publish "${post.title}": ${error}`,
        platform: 'youtube'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getVideoAnalytics(videoId: string, accessToken: string) {
    try {
      if (!this.youtube) {
        throw new Error('YouTube client not configured')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.youtube as any).auth.setCredentials({ access_token: accessToken })

      // Get video statistics
      const response = await this.youtube.videos.list({
        part: ['statistics', 'snippet'],
        id: [videoId]
      })

      const video = response.data.items?.[0]
      if (!video) {
        throw new Error('Video not found')
      }

      return {
        views: parseInt(video.statistics?.viewCount || '0'),
        likes: parseInt(video.statistics?.likeCount || '0'),
        comments: parseInt(video.statistics?.commentCount || '0'),
        publishedAt: video.snippet?.publishedAt
      }
    } catch (error) {
      console.error('YouTube analytics error:', error)
      return null
    }
  }

  private async sendNotification(type: string, data: NotificationData) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: data.title,
          message: data.message,
          platform: data.platform,
          actionUrl: data.actionUrl,
          metadata: {
            postId: data.postId,
            views: data.views,
            engagement: data.engagement
          }
        })
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }
}

// Twitter/X API Client
export class TwitterClient {
  private client: TwitterApi | null = null

  constructor() {
    if (process.env.TWITTER_BEARER_TOKEN) {
      this.client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN)
    }
  }

  async publishTweet(accessToken: string, accessSecret: string, post: SocialMediaPost): Promise<PublishResponse> {
    try {
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        throw new Error('Twitter API credentials not configured')
      }

      const userClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken,
        accessSecret
      })

      let mediaId: string | undefined

      // Upload media if video URL provided
      if (post.videoUrl) {
        // In a real implementation, you would download and upload the video
        // For now, we'll simulate this
        console.log('Uploading video to Twitter:', post.videoUrl)
      }

      const tweetData: TweetData = {
        text: this.formatTweetText(post.description, post.tags)
      }

      if (mediaId) {
        tweetData.media = { media_ids: [mediaId] as [string] }
      }

      const tweet = await userClient.v2.tweet(tweetData)

      await this.sendNotification('success', {
        title: 'Tweet Published',
        message: 'Your tweet has been successfully published.',
        platform: 'twitter',
        postId: tweet.data.id,
        actionUrl: `https://twitter.com/user/status/${tweet.data.id}`
      })

      return {
        success: true,
        postId: tweet.data.id,
        url: `https://twitter.com/user/status/${tweet.data.id}`
      }
    } catch (error) {
      console.error('Twitter publish error:', error)
      
      await this.sendNotification('error', {
        title: 'Twitter Publish Failed',
        message: `Failed to publish tweet: ${error}`,
        platform: 'twitter'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private formatTweetText(description: string, tags?: string[]): string {
    let text = description

    // Add hashtags if provided and within character limit
    if (tags && tags.length > 0) {
      const hashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')
      const potentialText = `${text} ${hashtags}`
      
      if (potentialText.length <= 280) {
        text = potentialText
      }
    }

    return text.slice(0, 280) // Ensure we don't exceed Twitter's limit
  }

  async getTweetAnalytics(tweetId: string) {
    try {
      if (!this.client) {
        throw new Error('Twitter client not configured')
      }

      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics', 'created_at']
      })

      return {
        views: tweet.data.public_metrics?.impression_count || 0,
        likes: tweet.data.public_metrics?.like_count || 0,
        retweets: tweet.data.public_metrics?.retweet_count || 0,
        replies: tweet.data.public_metrics?.reply_count || 0,
        createdAt: tweet.data.created_at
      }
    } catch (error) {
      console.error('Twitter analytics error:', error)
      return null
    }
  }

  private async sendNotification(type: string, data: NotificationData) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: data.title,
          message: data.message,
          platform: data.platform,
          actionUrl: data.actionUrl,
          metadata: {
            postId: data.postId
          }
        })
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }
}

// Instagram API Client (using Facebook Graph API)
export class InstagramClient {
  private baseUrl = 'https://graph.facebook.com/v18.0'

  async publishPost(accessToken: string, post: SocialMediaPost): Promise<PublishResponse> {
    try {
      // First, create media object
      const mediaResponse = await axios.post(`${this.baseUrl}/me/media`, {
        image_url: post.thumbnailUrl || post.videoUrl,
        caption: this.formatInstagramCaption(post.description, post.tags),
        access_token: accessToken
      })

      const mediaId = mediaResponse.data.id

      // Then publish the media
      const publishResponse = await axios.post(`${this.baseUrl}/me/media_publish`, {
        creation_id: mediaId,
        access_token: accessToken
      })

      await this.sendNotification('success', {
        title: 'Instagram Post Published',
        message: 'Your post has been successfully published to Instagram.',
        platform: 'instagram',
        postId: publishResponse.data.id,
        actionUrl: `https://instagram.com/p/${publishResponse.data.id}`
      })

      return {
        success: true,
        postId: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}`
      }
    } catch (error) {
      console.error('Instagram publish error:', error)
      
      await this.sendNotification('error', {
        title: 'Instagram Publish Failed',
        message: `Failed to publish to Instagram: ${error}`,
        platform: 'instagram'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private formatInstagramCaption(description: string, tags?: string[]): string {
    let caption = description

    if (tags && tags.length > 0) {
      const hashtags = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')
      caption = `${caption}\n\n${hashtags}`
    }

    return caption.slice(0, 2200) // Instagram's caption limit
  }

  async getPostAnalytics(postId: string, accessToken: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/${postId}/insights`, {
        params: {
          metric: 'impressions,reach,likes,comments,shares',
          access_token: accessToken
        }
      })

      const insights = response.data.data
      return {
        impressions: insights.find((i: InstagramInsight) => i.name === 'impressions')?.values[0]?.value || 0,
        reach: insights.find((i: InstagramInsight) => i.name === 'reach')?.values[0]?.value || 0,
        likes: insights.find((i: InstagramInsight) => i.name === 'likes')?.values[0]?.value || 0,
        comments: insights.find((i: InstagramInsight) => i.name === 'comments')?.values[0]?.value || 0,
        shares: insights.find((i: InstagramInsight) => i.name === 'shares')?.values[0]?.value || 0
      }
    } catch (error) {
      console.error('Instagram analytics error:', error)
      return null
    }
  }

  private async sendNotification(type: string, data: NotificationData) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: data.title,
          message: data.message,
          platform: data.platform,
          actionUrl: data.actionUrl,
          metadata: {
            postId: data.postId
          }
        })
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }
}

// LinkedIn API Client
export class LinkedInClient {
  private baseUrl = 'https://api.linkedin.com/v2'

  async publishPost(accessToken: string, post: SocialMediaPost): Promise<PublishResponse> {
    try {
      const postData = {
        author: 'urn:li:person:PERSON_ID', // This would be dynamic based on user
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: post.description
            },
            shareMediaCategory: 'VIDEO'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      }

      const response = await axios.post(`${this.baseUrl}/ugcPosts`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      })

      await this.sendNotification('success', {
        title: 'LinkedIn Post Published',
        message: 'Your post has been successfully published to LinkedIn.',
        platform: 'linkedin',
        postId: response.data.id
      })

      return {
        success: true,
        postId: response.data.id,
        url: `https://linkedin.com/feed/update/${response.data.id}`
      }
    } catch (error) {
      console.error('LinkedIn publish error:', error)
      
      await this.sendNotification('error', {
        title: 'LinkedIn Publish Failed',
        message: `Failed to publish to LinkedIn: ${error}`,
        platform: 'linkedin'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async sendNotification(type: string, data: NotificationData) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: data.title,
          message: data.message,
          platform: data.platform,
          actionUrl: data.actionUrl,
          metadata: {
            postId: data.postId
          }
        })
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }
}

// TikTok API Client (simplified - TikTok API is more complex)
export class TikTokClient {
  async publishVideo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessToken: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    post: SocialMediaPost
  ): Promise<PublishResponse> {
    try {
      // TikTok API implementation would go here
      // For now, we'll simulate the response
      const mockPostId = `tt_${Date.now()}`

      await this.sendNotification('success', {
        title: 'TikTok Video Published',
        message: 'Your video has been successfully published to TikTok.',
        platform: 'tiktok',
        postId: mockPostId
      })

      return {
        success: true,
        postId: mockPostId,
        url: `https://tiktok.com/@user/video/${mockPostId}`
      }
    } catch (error) {
      console.error('TikTok publish error:', error)
      
      await this.sendNotification('error', {
        title: 'TikTok Publish Failed',
        message: `Failed to publish to TikTok: ${error}`,
        platform: 'tiktok'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async sendNotification(type: string, data: NotificationData) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: data.title,
          message: data.message,
          platform: data.platform,
          metadata: {
            postId: data.postId
          }
        })
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }
}

// Main Social Media Manager
export class SocialMediaManager {
  private youtubeClient = new YouTubeClient()
  private twitterClient = new TwitterClient()
  private instagramClient = new InstagramClient()
  private linkedinClient = new LinkedInClient()
  private tiktokClient = new TikTokClient()

  async publishToMultiplePlatforms(
    platforms: string[],
    post: SocialMediaPost,
    accessTokens: Record<string, string>
  ): Promise<Record<string, PublishResponse>> {
    const results: Record<string, PublishResponse> = {}

    const publishPromises = platforms.map(async (platform) => {
      const accessToken = accessTokens[platform]
      if (!accessToken) {
        results[platform] = {
          success: false,
          error: 'No access token provided'
        }
        return
      }

      try {
        switch (platform) {
          case 'youtube':
            results[platform] = await this.youtubeClient.publishVideo(accessToken, post)
            break
          case 'twitter':
            results[platform] = await this.twitterClient.publishTweet(
              accessToken,
              accessTokens[`${platform}_secret`] || '',
              post
            )
            break
          case 'instagram':
            results[platform] = await this.instagramClient.publishPost(accessToken, post)
            break
          case 'linkedin':
            results[platform] = await this.linkedinClient.publishPost(accessToken, post)
            break
          case 'tiktok':
            results[platform] = await this.tiktokClient.publishVideo(accessToken, post)
            break
          default:
            results[platform] = {
              success: false,
              error: 'Unsupported platform'
            }
        }
      } catch (error) {
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    await Promise.all(publishPromises)
    return results
  }

  async getAnalyticsForPost(platform: string, postId: string, accessToken: string) {
    try {
      switch (platform) {
        case 'youtube':
          return await this.youtubeClient.getVideoAnalytics(postId, accessToken)
        case 'twitter':
          return await this.twitterClient.getTweetAnalytics(postId)
        case 'instagram':
          return await this.instagramClient.getPostAnalytics(postId, accessToken)
        default:
          return null
      }
    } catch (error) {
      console.error(`Error getting analytics for ${platform}:`, error)
      return null
    }
  }
}

export const socialMediaManager = new SocialMediaManager()
