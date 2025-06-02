import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { cloudinary } from '@/lib/cloudinary'
import { generateCaptions } from '@/lib/ai'

interface CaptionJob {
  videoId: string
  format?: 'srt' | 'vtt'
  language?: string
  userId: string
}

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export const captionQueue = new Queue<CaptionJob>('video-captions', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
})

// Process caption generation jobs
const worker = new Worker<CaptionJob>('video-captions', async (job) => {
  try {
    const { videoId, format = 'srt', language, userId } = job.data

    // Get video URL from Cloudinary
    const videoUrl = cloudinary.url(videoId, {
      resource_type: 'video',
      format: 'mp4'
    })

    // Generate captions
    const captions = await generateCaptions(videoUrl, { format, language })

    // Upload captions to Cloudinary
    const captionUploadResult = await cloudinary.uploader.upload(
      `data:text/plain;base64,${Buffer.from(captions).toString('base64')}`,
      {
        resource_type: 'raw',
        public_id: `captions/${videoId}/${format}`,
        format: format,
        overwrite: true
      }
    )

    // Update video with caption URL
    await cloudinary.api.update(videoId, {
      resource_type: 'video',
      raw_transformation: `co_${format},l_captions:${videoId}/${format}`
    })

    // Store the job result
    return {
      success: true,
      captionUrl: captionUploadResult.secure_url,
      format
    }

  } catch (error) {
    console.error(`Error processing caption job for video ${job.data.videoId}:`, error)
    throw error // This will trigger a retry based on the job options
  }
}, { 
  connection,
  concurrency: 5 // Process 5 jobs simultaneously
})

// Handle worker events
worker.on('completed', (job) => {
  console.log(`Caption job completed for video ${job.data.videoId}`)
})

worker.on('failed', (job, error) => {
  console.error(`Caption job failed for video ${job?.data?.videoId}:`, error)
})

export async function addToCaptionQueue(job: CaptionJob) {
  return captionQueue.add(`caption-${job.videoId}`, job)
}

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
