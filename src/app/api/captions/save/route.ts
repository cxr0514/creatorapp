import { NextRequest, NextResponse } from 'next/server'
import { uploadToB2 } from '@/lib/b2'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { videoId, captions, format = 'srt' } = body

    if (!videoId || !captions) {
      return NextResponse.json({ error: 'Video ID and captions are required' }, { status: 400 })
    }

    // Upload captions to B2
    const captionBuffer = Buffer.from(captions, 'utf-8')
    const captionKey = `captions/${session.user.id}/${videoId}.${format}`
    const captionUploadResult = await uploadToB2(
      captionBuffer,
      captionKey,
      `text/${format}`
    )

    return NextResponse.json({
      success: true,
      captionUrl: captionUploadResult.storageUrl,
      captionKey: captionUploadResult.storageKey,
      format
    })

  } catch (error) {
    console.error('Error saving captions:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
