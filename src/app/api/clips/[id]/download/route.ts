import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clipId = parseInt(params.id, 10)
    
    if (isNaN(clipId)) {
      return NextResponse.json({ error: 'Invalid clip ID' }, { status: 400 })
    }

    // Find the clip and ensure it belongs to the current user
    const clip = await prisma.clip.findFirst({
      where: {
        id: clipId,
        user: {
          email: session.user.email
        }
      }
    })

    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    // In a real application, you would:
    // 1. Generate a signed URL for the clip file from Cloudinary
    // 2. Stream the file content
    // 3. Handle proper file headers

    // For demo purposes, we'll redirect to the Cloudinary URL
    return NextResponse.redirect(clip.cloudinaryUrl)
  } catch (error) {
    console.error('Error downloading clip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
