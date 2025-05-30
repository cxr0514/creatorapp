import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateVideoMetadata, generateClipMetadata, improveMetadata } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, ...params } = await request.json()

    if (!type || !['video', 'clip', 'improve'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be: video, clip, or improve' }, { status: 400 })
    }

    let result
    
    switch (type) {
      case 'video':
        result = await generateVideoMetadata(params)
        break
      case 'clip':
        result = await generateClipMetadata(params)
        break
      case 'improve':
        result = await improveMetadata(params.currentMetadata, params.context)
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, metadata: result })
  } catch (error) {
    console.error('Error in AI metadata generation:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable',
        details: error.message 
      }, { status: 503 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
