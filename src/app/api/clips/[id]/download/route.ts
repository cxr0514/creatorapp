import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clipId = params.id

    // Find the clip and ensure it belongs to the current user
    const clip = await prisma.clip.findFirst({
      where: {
        id: clipId,
        video: {
          user: {
            email: session.user.email
          }
        }
      }
    })

    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    if (clip.status !== 'ready') {
      return NextResponse.json({ error: 'Clip is not ready for download' }, { status: 400 })
    }

    // In a real application, you would:
    // 1. Generate a signed URL for the clip file
    // 2. Stream the file content
    // 3. Handle proper file headers

    // For demo purposes, we'll return a mock response
    return new NextResponse('Mock video file content', {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${clip.title}.mp4"`
      }
    })
  } catch (error) {
    console.error('Error downloading clip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
