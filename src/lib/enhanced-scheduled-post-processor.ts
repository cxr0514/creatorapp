// Enhanced background job processor for scheduled social media posts
// This service handles the execution of scheduled posts at their designated times
// with comprehensive error monitoring and logging

import { getPlatformPublisher } from './platform-publishers'
import { logger } from './logging'
import { errorMonitor, ErrorMetrics } from './error-monitoring'
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
  processingTime?: number
}

export class EnhancedScheduledPostProcessor {
  private static instance: EnhancedScheduledPostProcessor
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  static getInstance(): EnhancedScheduledPostProcessor {
    if (!this.instance) {
      this.instance = new EnhancedScheduledPostProcessor()
    }
    return this.instance
  }

  // Start the background processor with error monitoring
  start(intervalMs = 60000): void { // Check every minute by default
    if (this.processingInterval) {
      logger.warn('Scheduled post processor already running')
      return
    }

    logger.info('Starting enhanced scheduled post processor', { intervalMs })

    this.processingInterval = setInterval(() => {
      this.processScheduledPosts().catch(async (error) => {
        await errorMonitor.recordError(error, {
          operation: 'scheduled_processing',
          platform: 'system'
        })
      })
    }, intervalMs)
  }

  // Stop the background processor
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      logger.info('Scheduled post processor stopped')
    }
  }

  // Process all due scheduled posts with comprehensive error handling
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

      logger.info(`Processing scheduled posts`, { jobCount: dueJobs.length })

      for (const job of dueJobs) {
        // Check circuit breaker before processing
        if (errorMonitor.shouldCircuitBreak(job.platform)) {
          logger.warn(`Circuit breaker active for platform`, {
            platform: job.platform,
            postId: job.id
          })
          continue
        }

        await this.executeScheduledPost(job)
      }
    } catch (error) {
      await errorMonitor.recordError(error as Error, {
        operation: 'process_scheduled_posts',
        platform: 'system'
      })
    } finally {
      this.isProcessing = false
    }
  }

  // Execute a single scheduled post with full monitoring
  async executeScheduledPost(job: ScheduledPostJob): Promise<JobResult> {
    const startTime = Date.now()
    const executedAt = new Date()

    try {
      // Record publish attempt
      await errorMonitor.recordPublishAttempt()
      await logger.logPublishAttempt(job.id, job.platform, job.userId)

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

      const processingTime = Date.now() - startTime

      // Record success metrics
      await errorMonitor.recordPublishSuccess(processingTime)
      await logger.logPublishSuccess(
        job.id, 
        job.platform, 
        job.userId, 
        publishResult.platformPostId
      )

      const result: JobResult = {
        success: true,
        platformPostId: publishResult.platformPostId,
        platformUrl: publishResult.platformUrl,
        executedAt,
        processingTime
      }

      // TODO: Update database when available
      /*
      await prisma.scheduledPost.update({
        where: { id: job.id },
        data: {
          status: 'published',
          publishedAt: executedAt,
          platformPostId: publishResult.platformPostId,
          platformUrl: publishResult.platformUrl
        }
      })
      */

      return result

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Record failure metrics
      await errorMonitor.recordPublishFailure()
      await errorMonitor.recordError(error as Error, {
        operation: 'execute_scheduled_post',
        platform: job.platform,
        userId: job.userId,
        postId: job.id
      })
      await logger.logPublishFailure(job.id, job.platform, job.userId, error as Error)

      // TODO: Update database when available
      /*
      const newRetryCount = job.retryCount + 1
      if (newRetryCount >= job.maxRetries) {
        // Mark as failed
        await prisma.scheduledPost.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMessage,
            retryCount: newRetryCount
          }
        })
        
        await logger.error(`Post marked as failed after max retries`, undefined, {
          postId: job.id,
          platform: job.platform,
          maxRetries: job.maxRetries
        })
      } else {
        // Schedule retry
        const retryDelay = this.calculateRetryDelay(newRetryCount)
        const newScheduledTime = new Date(Date.now() + retryDelay)

        await prisma.scheduledPost.update({
          where: { id: job.id },
          data: {
            scheduledFor: newScheduledTime,
            retryCount: newRetryCount,
            errorMessage
          }
        })

        await logger.info(`Post scheduled for retry`, {
          postId: job.id,
          retryCount: newRetryCount,
          retryDelay,
          newScheduledTime: newScheduledTime.toISOString()
        })
      }
      */

      return {
        success: false,
        error: errorMessage,
        executedAt,
        processingTime
      }
    }
  }

  // Calculate exponential backoff delay for retries
  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 1min, 2min, 4min, 8min, etc.
    return Math.min(Math.pow(2, retryCount) * 60 * 1000, 30 * 60 * 1000) // Max 30 minutes
  }

  // Manual retry of a failed post with monitoring
  async retryFailedPost(postId: string): Promise<JobResult> {
    try {
      logger.info(`Manual retry initiated for post`, { postId })

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
        platformSettings: post.platformSettings as Record<string, unknown>,
        retryCount: 0, // Reset retry count for manual retry
        maxRetries: post.maxRetries
      }

      return await this.executeScheduledPost(job)
      */

      // Mock retry for testing
      const mockResult: JobResult = {
        success: false,
        error: 'Database not available for retry',
        executedAt: new Date()
      }

      logger.warn('Manual retry failed - database not available', { postId })
      return mockResult
    } catch (error) {
      await errorMonitor.recordError(error as Error, {
        operation: 'manual_retry',
        postId
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retry failed',
        executedAt: new Date()
      }
    }
  }

  // Get comprehensive processor status
  getStatus(): { 
    isRunning: boolean; 
    isProcessing: boolean; 
    errorMetrics: ErrorMetrics;
    uptime: number;
  } {
    return {
      isRunning: this.processingInterval !== null,
      isProcessing: this.isProcessing,
      errorMetrics: errorMonitor.getErrorMetrics(),
      uptime: process.uptime()
    }
  }

  // Get health check for the processor
  async getHealthCheck() {
    return await errorMonitor.performHealthCheck()
  }
}

// Initialize and export the singleton instance
export const enhancedScheduledPostProcessor = EnhancedScheduledPostProcessor.getInstance()

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  enhancedScheduledPostProcessor.start()
  logger.info('Enhanced scheduled post processor auto-started in production')
}

// Export the legacy processor for backward compatibility
export const scheduledPostProcessor = enhancedScheduledPostProcessor
