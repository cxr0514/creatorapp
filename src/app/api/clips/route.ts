import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clips = await prisma.clip.findMany({
      where: {
        video: {
          user: {
            email: session.user.email
          }
        }
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            filename: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedClips = clips.map(clip => ({
      id: clip.id,
      title: clip.title,
      startTime: clip.startTime,
      endTime: clip.endTime,
      createdAt: clip.createdAt.toISOString(),
      video: clip.video,
      thumbnailUrl: clip.thumbnailUrl,
      status: clip.status
    }))

    return NextResponse.json(formattedClips)
  } catch (error) {
    console.error('Error fetching clips:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId, title, startTime, endTime } = await request.json()

    if (!videoId || !title || startTime === undefined || endTime === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    // Verify the video belongs to the current user
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        user: {
          email: session.user.email
        }
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (endTime > video.duration) {
      return NextResponse.json({ error: 'End time exceeds video duration' }, { status: 400 })
    }

    const clip = await prisma.clip.create({
      data: {
        title,
        startTime,
        endTime,
        videoId,
        status: 'processing',
        thumbnailUrl: `https://example.com/clip-thumbnails/${Date.now()}-${title}.jpg`
      }
    })

    // In a real application, you would trigger video processing here
    // For demo purposes, we'll simulate processing completion after a delay
    setTimeout(async () => {
      try {
        await prisma.clip.update({
          where: { id: clip.id },
          data: {
            status: 'ready',
            fileUrl: `https://example.com/clips/${clip.id}.mp4`
          }
        })
      } catch (error) {
        console.error('Error updating clip status:', error)
      }
    }, 5000) // Simulate 5 second processing time

    return NextResponse.json({ 
      clipId: clip.id,
      message: 'Clip creation started' 
    })
  } catch (error) {
    console.error('Error creating clip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
