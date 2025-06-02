import { NextRequest, NextResponse } from 'next/server'
import { generateCaptions } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoUrl, format = 'srt', language } = body

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    const captions = await generateCaptions(videoUrl, { format, language })
    
    return NextResponse.json({ 
      captions,
      format,
      language: language || 'auto'
    })

  } catch (error) {
    console.error('Error in caption generation:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not yet implemented')) {
        return NextResponse.json({ 
          error: 'Audio extraction not yet available',
          details: 'We are working on implementing audio extraction capabilities'
        }, { status: 501 })
      }
      
      return NextResponse.json({ 
        error: 'Caption generation failed',
        details: error.message 
      }, { status: 503 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
