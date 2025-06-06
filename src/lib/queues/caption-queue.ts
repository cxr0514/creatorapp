import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { getPresignedUrl, uploadToB2 } from '@/lib/b2'
import { generateCaptions } from '@/lib/ai'

interface CaptionJob {
  videoId: string
  format?: 'srt' | 'vtt'
  language?: string
  userId: string
}

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const captionQueue = new Queue('caption-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

export const captionWorker = new Worker(
  'caption-processing',
  async (job) => {
    const { videoId, format = 'srt', language = 'en', userId } = job.data as CaptionJob

    try {
      console.log(`[CAPTION-WORKER] Processing captions for video ${videoId}`)

      // Get video URL from B2 using presigned URL
      const videoUrl = await getPresignedUrl(videoId)

      // Generate captions using AI
      const captions = await generateCaptions(videoUrl, {
        format,
        language,
      })

      // Upload captions to B2
      const captionBuffer = Buffer.from(captions, 'utf-8')
      const captionKey = `captions/${userId}/${videoId}.${format}`
      const captionUploadResult = await uploadToB2(
        captionBuffer,
        captionKey,
        `text/${format}`
      )

      console.log(`[CAPTION-WORKER] Captions uploaded for video ${videoId}: ${captionUploadResult.storageUrl}`)

      return {
        videoId,
        captionUrl: captionUploadResult.storageUrl,
        captionKey: captionUploadResult.storageKey,
        format,
        language,
      }
    } catch (error) {
      console.error(`[CAPTION-WORKER] Error processing captions for video ${videoId}:`, error)
      throw error
    }
  },
  {
    connection: redis,
    concurrency: 3,
  }
)

export async function addToCaptionQueue(data: CaptionJob) {
  return captionQueue.add('generate-captions', data, {
    priority: 1,
  })
}

// Alias for backward compatibility
export const addCaptionJob = addToCaptionQueue

// Handle worker events
captionWorker.on('completed', (job) => {
  console.log(`Caption job completed for video ${job.data.videoId}`)
})

captionWorker.on('failed', (job, error) => {
  console.error(`Caption job failed for video ${job?.data?.videoId}:`, error)
})

export async function getCaptionJobStatus(jobId: string) {
  const job = await captionQueue.getJob(jobId)
  if (!job) return null

  const state = await job.getState()
  const progress = job.progress
  const result = job.returnvalue

  return {
    id: job.id,
    state,
    progress,
    result,
    data: job.data,
    failedReason: job.failedReason
  }
}
