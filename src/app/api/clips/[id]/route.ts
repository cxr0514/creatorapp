import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
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

    await prisma.clip.delete({
      where: { id: clipId }
    })

    return NextResponse.json({ message: 'Clip deleted successfully' })
  } catch (error) {
    console.error('Error deleting clip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
