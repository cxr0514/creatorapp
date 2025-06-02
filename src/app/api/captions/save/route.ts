import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { videoId, captions, format = 'srt' } = body

    if (!videoId || !captions) {
      return NextResponse.json({ error: 'Video ID and captions are required' }, { status: 400 })
    }

    // Upload captions to Cloudinary
    const captionUploadResult = await cloudinary.uploader.upload(`data:text/plain;base64,${Buffer.from(captions).toString('base64')}`, {
      resource_type: 'raw',
      public_id: `captions/${videoId}/${format}`,
      format: format,
      overwrite: true
    })

    // Update video with caption URL
    await cloudinary.api.update(videoId, {
      resource_type: 'video',
      raw_transformation: `co_${format},l_captions:${videoId}/${format}`
    })

    return NextResponse.json({
      success: true,
      captionUrl: captionUploadResult.secure_url,
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
