import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { addToCaptionQueue, getCaptionJobStatus } from '@/lib/queues/caption-queue'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { videos, format = 'srt', language } = body

    if (!Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ error: 'List of video IDs is required' }, { status: 400 })
    }

    // Add caption generation jobs to queue
    const jobs = await Promise.all(
      videos.map(videoId => 
        addToCaptionQueue({
          videoId,
          format,
          language,
          userId: session.user.id
        })
      )
    )

    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        videoId: job.data.videoId
      }))
    })

  } catch (error) {
    console.error('Error queuing caption jobs:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get job ID from query params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const status = await getCaptionJobStatus(jobId)
    if (!status) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(status)

  } catch (error) {
    console.error('Error getting job status:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
