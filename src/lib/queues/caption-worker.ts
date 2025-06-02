import { Worker, Job } from 'bullmq'
import { generateCaptions } from '@/lib/ai'
import prisma from '@/lib/prisma'

export interface CaptionJob {
  videoId: string
  videoUrl: string
  format?: 'srt' | 'vtt'
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

const captionWorker = new Worker<CaptionJob>('captions', async (job: Job<CaptionJob>) => {
  try {
    const { videoId, videoUrl, format = 'srt' } = job.data

    // Update job progress
    await job.updateProgress(10)
    await job.log('Starting caption generation')

    // Generate captions
    const captions = await generateCaptions(videoUrl, { format })

    await job.updateProgress(50)
    await job.log('Captions generated, saving to database')

    // Save captions to database
    await prisma.video.update({
      where: { id: videoId },
      data: {
        captions: {
          upsert: {
            create: {
              content: captions,
              updatedAt: new Date()
            },
            update: {
              content: captions,
              updatedAt: new Date()
            }
          }
        }
      }
    })

    await job.updateProgress(100)
    await job.log('Caption generation complete')

    return captions
  } catch (error) {
    await job.log(`Error generating captions: ${error}`)
    throw error
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  concurrency: 2
})
