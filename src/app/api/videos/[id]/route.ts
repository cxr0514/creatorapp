import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { deleteVideoFromB2 } from '@/lib/b2'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videoId = params.id
    
    if (!videoId || isNaN(parseInt(videoId))) {
      return NextResponse.json({ error: 'Valid video ID is required' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the video and verify ownership
    const video = await prisma.video.findFirst({
      where: {
        id: parseInt(videoId),
        userId: user.id
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 })
    }

    console.log(`Deleting video ${video.id} (${video.title}) for user ${user.id}`)

    let b2DeleteSuccess = false
    let b2DeleteError: string | undefined

    try {
      // Delete from B2 storage first
      await deleteVideoFromB2(video.storageKey)
      b2DeleteSuccess = true
      console.log(`Successfully deleted video from B2: ${video.storageKey}`)
    } catch (error) {
      b2DeleteError = error instanceof Error ? error.message : 'Unknown error'
      console.warn(`Failed to delete video from B2: ${b2DeleteError}`)
    }

    try {
      // Delete associated clips first (foreign key constraint)
      const deletedClips = await prisma.clip.deleteMany({
        where: { videoId: video.id }
      })

      console.log(`Deleted ${deletedClips.count} associated clips`)

      // Delete video from database
      await prisma.video.delete({
        where: { id: video.id }
      })

      console.log(`Successfully deleted video ${video.id} from database`)

      return NextResponse.json({ 
        success: true,
        message: 'Video deleted successfully',
        deletedVideo: {
          id: video.id,
          title: video.title,
          storageKey: video.storageKey
        },
        deletedClips: deletedClips.count,
        storage: {
          b2Deleted: b2DeleteSuccess,
          b2Error: b2DeleteError
        }
      })

    } catch (dbError) {
      console.error('Error deleting from database:', dbError)
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete video from database',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          storage: {
            b2Deleted: b2DeleteSuccess,
            b2Error: b2DeleteError
          }
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in DELETE video:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videoId = params.id
    
    if (!videoId || isNaN(parseInt(videoId))) {
      return NextResponse.json({ error: 'Valid video ID is required' }, { status: 400 })
    }

    // Find the video and verify ownership
    const video = await prisma.video.findFirst({
      where: {
        id: parseInt(videoId),
        user: {
          email: session.user.email
        }
      },
      include: {
        _count: {
          select: {
            clips: true
          }
        }
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 })
    }

    const formattedVideo = {
      id: video.id,
      title: video.title,
      filename: video.title,
      url: video.storageUrl,
      publicId: video.storageKey,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      createdAt: video.uploadedAt.toISOString(),
      clipCount: video._count.clips,
      fileSize: video.fileSize
    }

    return NextResponse.json(formattedVideo)

  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
