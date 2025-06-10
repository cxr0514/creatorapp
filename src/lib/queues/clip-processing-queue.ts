import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { processVideoClipFromStorage } from '@/lib/video/clip-processor'
import { prisma } from '@/lib/prisma'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

interface ClipProcessingJob {
  clipId: number
  videoStorageKey: string
  outputStorageKey: string
  startTime: number
  endTime: number
  aspectRatio: string
}

export const clipProcessingQueue = new Queue('clip-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})

export const clipProcessingWorker = new Worker(
  'clip-processing',
  async (job) => {
    const {
      clipId,
      videoStorageKey,
      outputStorageKey,
      startTime,
      endTime,
      aspectRatio
    } = job.data as ClipProcessingJob

    try {
      console.log(`[CLIP-WORKER] Processing clip ${clipId}`)

      // Update clip status to processing
      await prisma.clip.update({
        where: { id: clipId },
        data: { status: 'processing' }
      })

      // Process the video clip
      const result = await processVideoClipFromStorage(
        videoStorageKey,
        {
          startTime,
          endTime,
          aspectRatio,
          quality: 'medium'
        },
        outputStorageKey
      )

      // Update clip with processed URLs
      await prisma.clip.update({
        where: { id: clipId },
        data: {
          storageUrl: result.clipUrl,
          thumbnailUrl: result.thumbnailUrl,
          status: 'ready'
        }
      })

      console.log(`[CLIP-WORKER] Clip ${clipId} processed successfully`)
      return { success: true, clipId, clipUrl: result.clipUrl }

    } catch (error) {
      console.error(`[CLIP-WORKER] Error processing clip ${clipId}:`, error)
      
      // Update clip status to failed
      await prisma.clip.update({
        where: { id: clipId },
        data: { 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw error
    }
  },
  { connection: redis }
)

export async function addClipToProcessingQueue(jobData: ClipProcessingJob) {
  const job = await clipProcessingQueue.add('process-clip', jobData, {
    delay: 1000, // Small delay to ensure database transaction is committed
  })
  
  console.log(`[CLIP-QUEUE] Added clip ${jobData.clipId} to processing queue with job ID: ${job.id}`)
  return job
}

export async function getClipJobStatus(clipId: number) {
  const jobs = await clipProcessingQueue.getJobs(['waiting', 'active', 'completed', 'failed'])
  const clipJob = jobs.find(job => job.data.clipId === clipId)
  
  if (!clipJob) {
    return null
  }

  return {
    id: clipJob.id,
    status: await clipJob.getState(),
    progress: clipJob.progress,
    data: clipJob.data,
    error: clipJob.failedReason
  }
}
