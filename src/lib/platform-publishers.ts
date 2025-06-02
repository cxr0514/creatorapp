// Platform-specific publishing implementations
// This file contains the publishing logic for each social media platform

export interface PublishRequest {
  title: string
  description?: string
  hashtags?: string[]
  videoUrl: string
  thumbnailUrl?: string
  aspectRatio: string
  platform: string
  accessToken: string
  platformSettings?: Record<string, any>
}

export interface PublishResponse {
  success: boolean
  platformPostId?: string
  platformUrl?: string
  error?: string
}

export interface PlatformPublisher {
  publish(request: PublishRequest): Promise<PublishResponse>
  validateContent(request: PublishRequest): Promise<boolean>
  getMaxDuration(): number // in seconds
  getSupportedAspectRatios(): string[]
}

// YouTube Publisher
export class YouTubePublisher implements PlatformPublisher {
  async publish(request: PublishRequest): Promise<PublishResponse> {
    try {
      // Step 1: Initialize upload
      const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            title: request.title,
            description: this.formatDescription(request.description, request.hashtags),
            tags: request.hashtags || [],
            categoryId: '22' // People & Blogs
          },
          status: {
            privacyStatus: request.platformSettings?.privacyStatus || 'public'
          }
        })
      })

      const uploadUrl = initResponse.headers.get('location')
      if (!uploadUrl) {
        throw new Error('Failed to get upload URL from YouTube')
      }

      // Step 2: Upload video file
      const videoResponse = await fetch(request.videoUrl)
      const videoBuffer = await videoResponse.arrayBuffer()

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/*'
        },
        body: videoBuffer
      })

      const result = await uploadResponse.json()

      return {
        success: true,
        platformPostId: result.id,
        platformUrl: `https://youtube.com/watch?v=${result.id}`
      }
    } catch (error) {
      console.error('YouTube publishing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'YouTube publishing failed'
      }
    }
  }

  async validateContent(request: PublishRequest): Promise<boolean> {
    // YouTube validation rules
    if (request.title.length > 100) return false
    if (request.description && request.description.length > 5000) return false
    return true
  }

  getMaxDuration(): number {
    return 3600 // 1 hour for verified accounts, 15 minutes otherwise
  }

  getSupportedAspectRatios(): string[] {
    return ['16:9', '9:16', '4:3', '1:1']
  }

  private formatDescription(description?: string, hashtags?: string[]): string {
    let formatted = description || ''
    if (hashtags && hashtags.length > 0) {
      formatted += '\n\n' + hashtags.map(tag => `#${tag}`).join(' ')
    }
    return formatted
  }
}

// TikTok Publisher
export class TikTokPublisher implements PlatformPublisher {
  async publish(request: PublishRequest): Promise<PublishResponse> {
    try {
      // TikTok requires video upload to their servers first
      const videoResponse = await fetch(request.videoUrl)
      const videoBuffer = await videoResponse.arrayBuffer()

      // Step 1: Get upload URL
      const uploadUrlResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_info: {
            title: request.title,
            description: this.formatDescription(request.description, request.hashtags),
            privacy_level: request.platformSettings?.privacyLevel || 'SELF_ONLY',
            disable_duet: request.platformSettings?.disableDuet || false,
            disable_comment: request.platformSettings?.disableComment || false,
            disable_stitch: request.platformSettings?.disableStitch || false
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoBuffer.byteLength
          }
        })
      })

      const uploadData = await uploadUrlResponse.json()
      const uploadUrl = uploadData.data?.upload_url

      if (!uploadUrl) {
        throw new Error('Failed to get upload URL from TikTok')
      }

      // Step 2: Upload video
      const formData = new FormData()
      formData.append('video', new Blob([videoBuffer], { type: 'video/mp4' }))

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: formData
      })

      // Step 3: Publish
      const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: uploadData.data?.post_id
        })
      })

      const result = await publishResponse.json()

      return {
        success: true,
        platformPostId: result.data?.post_id,
        platformUrl: `https://tiktok.com/@username/video/${result.data?.post_id}` // Username would come from profile
      }
    } catch (error) {
      console.error('TikTok publishing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TikTok publishing failed'
      }
    }
  }

  async validateContent(request: PublishRequest): Promise<boolean> {
    // TikTok validation rules
    if (request.title.length > 150) return false
    if (!['9:16', '1:1'].includes(request.aspectRatio)) return false
    return true
  }

  getMaxDuration(): number {
    return 600 // 10 minutes
  }

  getSupportedAspectRatios(): string[] {
    return ['9:16', '1:1']
  }

  private formatDescription(description?: string, hashtags?: string[]): string {
    let formatted = description || ''
    if (hashtags && hashtags.length > 0) {
      formatted += ' ' + hashtags.map(tag => `#${tag}`).join(' ')
    }
    return formatted.slice(0, 2200) // TikTok limit
  }
}

// Instagram Publisher
export class InstagramPublisher implements PlatformPublisher {
  async publish(request: PublishRequest): Promise<PublishResponse> {
    try {
      // Instagram requires uploading to their servers
      const containerResponse = await fetch(`https://graph.instagram.com/me/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          media_type: 'VIDEO',
          video_url: request.videoUrl,
          caption: this.formatCaption(request.title, request.description, request.hashtags),
          access_token: request.accessToken
        })
      })

      const containerData = await containerResponse.json()
      
      if (!containerData.id) {
        throw new Error('Failed to create Instagram media container')
      }

      // Wait for processing and publish
      let attempts = 0
      const maxAttempts = 30
      
      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`https://graph.instagram.com/${containerData.id}?fields=status_code&access_token=${request.accessToken}`)
        const statusData = await statusResponse.json()
        
        if (statusData.status_code === 'FINISHED') {
          // Publish the media
          const publishResponse = await fetch(`https://graph.instagram.com/me/media_publish`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              creation_id: containerData.id,
              access_token: request.accessToken
            })
          })

          const publishData = await publishResponse.json()
          
          return {
            success: true,
            platformPostId: publishData.id,
            platformUrl: `https://instagram.com/p/${publishData.id}`
          }
        }
        
        if (statusData.status_code === 'ERROR') {
          throw new Error('Instagram media processing failed')
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++
      }

      throw new Error('Instagram media processing timeout')
    } catch (error) {
      console.error('Instagram publishing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Instagram publishing failed'
      }
    }
  }

  async validateContent(request: PublishRequest): Promise<boolean> {
    // Instagram validation rules
    const caption = this.formatCaption(request.title, request.description, request.hashtags)
    if (caption.length > 2200) return false
    if (!['9:16', '1:1', '4:5'].includes(request.aspectRatio)) return false
    return true
  }

  getMaxDuration(): number {
    return 90 // 90 seconds for Reels
  }

  getSupportedAspectRatios(): string[] {
    return ['9:16', '1:1', '4:5']
  }

  private formatCaption(title: string, description?: string, hashtags?: string[]): string {
    let caption = title
    if (description) {
      caption += '\n\n' + description
    }
    if (hashtags && hashtags.length > 0) {
      caption += '\n\n' + hashtags.map(tag => `#${tag}`).join(' ')
    }
    return caption
  }
}

// Twitter Publisher  
export class TwitterPublisher implements PlatformPublisher {
  async publish(request: PublishRequest): Promise<PublishResponse> {
    try {
      // Twitter requires uploading media first, then creating tweet
      const videoResponse = await fetch(request.videoUrl)
      const videoBuffer = await videoResponse.arrayBuffer()

      // Step 1: Upload media
      const uploadResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.accessToken}`,
          'Content-Type': 'multipart/form-data'
        },
        body: new FormData().append('media', new Blob([videoBuffer], { type: 'video/mp4' }))
      })

      const mediaData = await uploadResponse.json()

      // Step 2: Create tweet
      const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: this.formatText(request.title, request.description, request.hashtags),
          media: {
            media_ids: [mediaData.media_id_string]
          }
        })
      })

      const tweetData = await tweetResponse.json()

      return {
        success: true,
        platformPostId: tweetData.data?.id,
        platformUrl: `https://twitter.com/user/status/${tweetData.data?.id}`
      }
    } catch (error) {
      console.error('Twitter publishing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twitter publishing failed'
      }
    }
  }

  async validateContent(request: PublishRequest): Promise<boolean> {
    // Twitter validation rules
    const text = this.formatText(request.title, request.description, request.hashtags)
    if (text.length > 280) return false
    return true
  }

  getMaxDuration(): number {
    return 140 // 2 minutes 20 seconds
  }

  getSupportedAspectRatios(): string[] {
    return ['16:9', '9:16', '1:1']
  }

  private formatText(title: string, description?: string, hashtags?: string[]): string {
    let text = title
    if (description) {
      text += ' ' + description
    }
    if (hashtags && hashtags.length > 0) {
      text += ' ' + hashtags.map(tag => `#${tag}`).join(' ')
    }
    return text.slice(0, 280)
  }
}

// LinkedIn Publisher
export class LinkedInPublisher implements PlatformPublisher {
  async publish(request: PublishRequest): Promise<PublishResponse> {
    try {
      // LinkedIn video publishing is more complex, requires multiple steps
      const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${request.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          author: 'urn:li:person:PERSON_ID', // Would be replaced with actual person ID
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: this.formatText(request.title, request.description, request.hashtags)
              },
              shareMediaCategory: 'VIDEO',
              media: [{
                status: 'READY',
                description: {
                  text: request.description || ''
                },
                media: request.videoUrl,
                title: {
                  text: request.title
                }
              }]
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      })

      const postData = await postResponse.json()

      return {
        success: true,
        platformPostId: postData.id,
        platformUrl: `https://linkedin.com/feed/update/${postData.id}`
      }
    } catch (error) {
      console.error('LinkedIn publishing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LinkedIn publishing failed'
      }
    }
  }

  async validateContent(request: PublishRequest): Promise<boolean> {
    // LinkedIn validation rules
    const text = this.formatText(request.title, request.description, request.hashtags)
    if (text.length > 3000) return false
    return true
  }

  getMaxDuration(): number {
    return 600 // 10 minutes
  }

  getSupportedAspectRatios(): string[] {
    return ['16:9', '1:1', '9:16']
  }

  private formatText(title: string, description?: string, hashtags?: string[]): string {
    let text = title
    if (description) {
      text += '\n\n' + description
    }
    if (hashtags && hashtags.length > 0) {
      text += '\n\n' + hashtags.map(tag => `#${tag}`).join(' ')
    }
    return text
  }
}

// Factory function to get platform publisher
export function getPlatformPublisher(platform: string): PlatformPublisher {
  switch (platform.toLowerCase()) {
    case 'youtube':
      return new YouTubePublisher()
    case 'tiktok':
      return new TikTokPublisher()
    case 'instagram':
      return new InstagramPublisher()
    case 'twitter':
      return new TwitterPublisher()
    case 'linkedin':
      return new LinkedInPublisher()
    default:
      throw new Error(`Platform ${platform} not supported`)
  }
}
