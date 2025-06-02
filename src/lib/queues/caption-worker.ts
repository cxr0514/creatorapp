import { Worker, Job } from 'bullmq'
import { generateCaptions } from '@/lib/ai'

export interface CaptionJob {
  videoId: number
  videoUrl: string
  format?: 'srt' | 'vtt'
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export const captionWorker = new Worker<CaptionJob>('captions', async (job: Job<CaptionJob>) => {
  try {
    const { videoUrl, format = 'srt' } = job.data

    // Update job progress
    await job.updateProgress(10)
    await job.log('Starting caption generation')

    // Generate captions
    const captions = await generateCaptions(videoUrl, { format })

    await job.updateProgress(50)
    await job.log('Captions generated, saving to database')

    // For now, just return the captions since the Video model doesn't have a captions field
    // In the future, you might want to create a separate Captions table or store in file system
    await job.updateProgress(90)
    await job.log('Caption processing complete')

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
