import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const videoId = parseInt(id, 10)
    
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Find the video and ensure it belongs to the current user
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

    // Delete all clips associated with this video first
    await prisma.clip.deleteMany({
      where: { videoId }
    })

    // Then delete the video
    await prisma.video.delete({
      where: { id: videoId }
    })

    return NextResponse.json({ message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
