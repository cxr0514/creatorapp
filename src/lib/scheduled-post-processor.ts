// Background job processor for scheduled social media posts
// This service handles the execution of scheduled posts at their designated times

import { getPlatformPublisher } from './platform-publishers'
// import { prisma } from './prisma' // TODO: Uncomment when database is ready

export interface ScheduledPostJob {
  id: string
  userId: string
  clipId?: number
  platform: string
  title: string
  description?: string
  hashtags?: string[]
  videoUrl: string
  thumbnailUrl?: string
  aspectRatio: string
  scheduledFor: Date
  platformSettings?: Record<string, unknown>
  retryCount: number
  maxRetries: number
}

export interface JobResult {
  success: boolean
  platformPostId?: string
  platformUrl?: string
  error?: string
  executedAt: Date
}

export class ScheduledPostProcessor {
  private static instance: ScheduledPostProcessor
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  static getInstance(): ScheduledPostProcessor {
    if (!this.instance) {
      this.instance = new ScheduledPostProcessor()
    }
    return this.instance
  }

  // Start the background processor
  start(intervalMs = 60000): void { // Check every minute by default
    if (this.processingInterval) {
      console.log('Scheduled post processor already running')
      return
    }

    console.log('Starting scheduled post processor...')
    this.processingInterval = setInterval(() => {
      this.processScheduledPosts().catch(error => {
        console.error('Error in scheduled post processor:', error)
      })
    }, intervalMs)
  }

  // Stop the background processor
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log('Scheduled post processor stopped')
    }
  }

  // Process all due scheduled posts
  async processScheduledPosts(): Promise<void> {
    if (this.isProcessing) {
      return // Prevent overlapping executions
    }

    this.isProcessing = true

    try {
      // TODO: Get scheduled posts from database when available
      /*
      const dueJobs = await prisma.scheduledPost.findMany({
        where: {
          status: 'scheduled',
          scheduledFor: {
            lte: new Date()
          }
        },
        include: {
          user: true,
          clip: true
        }
      })
      */

      // Mock scheduled jobs for testing
      const dueJobs: ScheduledPostJob[] = []

      console.log(`Processing ${dueJobs.length} scheduled posts`)

      for (const job of dueJobs) {
        await this.executeScheduledPost(job)
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error)
    } finally {
      this.isProcessing = false
    }
  }

  // Execute a single scheduled post
  async executeScheduledPost(job: ScheduledPostJob): Promise<JobResult> {
    const startTime = new Date()

    try {
      console.log(`Executing scheduled post ${job.id} for platform ${job.platform}`)

      // TODO: Get access token from database when available
      /*
      const socialAccount = await prisma.socialAccount.findUnique({
        where: {
          userId_platform: {
            userId: job.userId,
            platform: job.platform
          }
        }
      })

      if (!socialAccount || !socialAccount.isActive) {
        throw new Error(`No active ${job.platform} account for user ${job.userId}`)
      }

      const accessToken = decrypt(socialAccount.accessToken)
      */

      // Mock access token for testing
      const accessToken = 'mock_access_token_for_' + job.platform

      // Get platform publisher
      const publisher = getPlatformPublisher(job.platform)

      // Validate content before publishing
      const isValid = await publisher.validateContent({
        title: job.title,
        description: job.description,
        hashtags: job.hashtags,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        aspectRatio: job.aspectRatio,
        platform: job.platform,
        accessToken,
        platformSettings: job.platformSettings
      })

      if (!isValid) {
        throw new Error(`Content validation failed for ${job.platform}`)
      }

      // Publish the content
      const publishResult = await publisher.publish({
        title: job.title,
        description: job.description,
        hashtags: job.hashtags,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        aspectRatio: job.aspectRatio,
        platform: job.platform,
        accessToken,
        platformSettings: job.platformSettings
      })

      if (!publishResult.success) {
        throw new Error(publishResult.error || 'Publishing failed')
      }

      const result: JobResult = {
        success: true,
        platformPostId: publishResult.platformPostId,
        platformUrl: publishResult.platformUrl,
        executedAt: startTime
      }

      // TODO: Update database when available
      /*
      await prisma.scheduledPost.update({
        where: { id: job.id },
        data: {
          status: 'published',
          publishedAt: startTime,
          platformPostId: publishResult.platformPostId,
          platformUrl: publishResult.platformUrl
        }
      })
      */

      console.log(`Successfully published scheduled post ${job.id} to ${job.platform}`)
      return result

    } catch (error) {
      console.error(`Error executing scheduled post ${job.id}:`, error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // TODO: Update database when available
      /*
      if (job.retryCount + 1 >= job.maxRetries) {
        // Mark as failed
        await prisma.scheduledPost.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMessage,
            retryCount: job.retryCount + 1
          }
        })
      } else {
        // Schedule retry
        const retryDelay = this.calculateRetryDelay(job.retryCount + 1)
        const newScheduledTime = new Date(Date.now() + retryDelay)

        await prisma.scheduledPost.update({
          where: { id: job.id },
          data: {
            scheduledFor: newScheduledTime,
            retryCount: job.retryCount + 1,
            errorMessage
          }
        })
      }
      */

      return {
        success: false,
        error: errorMessage,
        executedAt: startTime
      }
    }
  }

  // Calculate exponential backoff delay for retries
  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 1min, 2min, 4min, 8min, etc.
    return Math.min(Math.pow(2, retryCount) * 60 * 1000, 30 * 60 * 1000) // Max 30 minutes
  }

  // Manual retry of a failed post
  async retryFailedPost(postId: string): Promise<JobResult> {
    try {
      // TODO: Get post from database when available
      /*
      const post = await prisma.scheduledPost.findUnique({
        where: { id: postId },
        include: { user: true, clip: true }
      })

      if (!post) {
        throw new Error('Scheduled post not found')
      }

      if (post.status !== 'failed') {
        throw new Error('Post is not in failed status')
      }

      const job: ScheduledPostJob = {
        id: post.id,
        userId: post.userId,
        clipId: post.clipId,
        platform: post.platform,
        title: post.title,
        description: post.description,
        hashtags: post.hashtags,
        videoUrl: post.clip?.cloudinaryUrl || '',
        thumbnailUrl: post.clip?.thumbnailUrl,
        aspectRatio: post.clip?.aspectRatio || '16:9',
        scheduledFor: new Date(),
        platformSettings: post.platformSettings as Record<string, any>,
        retryCount: post.retryCount,
        maxRetries: post.maxRetries
      }

      return await this.executeScheduledPost(job)
      */

      // Mock retry for testing
      return {
        success: false,
        error: 'Database not available for retry',
        executedAt: new Date()
      }
    } catch (error) {
      console.error(`Error retrying failed post ${postId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retry failed',
        executedAt: new Date()
      }
    }
  }

  // Get processor status
  getStatus(): { isRunning: boolean; isProcessing: boolean } {
    return {
      isRunning: this.processingInterval !== null,
      isProcessing: this.isProcessing
    }
  }
}

// Initialize and export the singleton instance
export const scheduledPostProcessor = ScheduledPostProcessor.getInstance()

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  scheduledPostProcessor.start()
}
