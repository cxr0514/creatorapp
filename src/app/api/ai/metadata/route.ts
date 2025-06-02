import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateVideoMetadata, generateClipMetadata, improveMetadata } from '@/lib/ai'
import { AIMetadataService, type AIMetadataOptions } from '@/lib/ai/metadata-service'
import { isAIAvailable } from '@/lib/ai/openai-client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if AI is available
    if (!isAIAvailable()) {
      return NextResponse.json(
        { error: 'AI service is not available. Please configure OPENAI_API_KEY.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { type, videoTitle, videoDescription, options, ...legacyParams } = body

    // Handle new AI metadata generation types
    if (['title', 'description', 'hashtags', 'categories', 'complete'].includes(type)) {
      // Validate required fields for new types
      if (!videoTitle && !videoDescription) {
        return NextResponse.json(
          { error: 'Missing required fields: videoTitle or videoDescription' },
          { status: 400 }
        )
      }

      const aiOptions: AIMetadataOptions = {
        contentType: options?.contentType || 'other',
        targetAudience: options?.targetAudience || 'general',
        platform: options?.platform || 'all',
        videoDuration: options?.videoDuration,
      }

      let result

      switch (type) {
        case 'title':
          if (!videoDescription) {
            return NextResponse.json(
              { error: 'videoDescription is required for title generation' },
              { status: 400 }
            )
          }
          result = await AIMetadataService.generateTitle(videoDescription, aiOptions)
          break

        case 'description':
          if (!videoTitle) {
            return NextResponse.json(
              { error: 'videoTitle is required for description generation' },
              { status: 400 }
            )
          }
          result = await AIMetadataService.generateDescription(
            videoTitle,
            videoDescription || '',
            aiOptions
          )
          break

        case 'hashtags':
          if (!videoTitle) {
            return NextResponse.json(
              { error: 'videoTitle is required for hashtag generation' },
              { status: 400 }
            )
          }
          result = await AIMetadataService.generateHashtags(
            videoTitle,
            videoDescription || '',
            aiOptions
          )
          break

        case 'categories':
          if (!videoTitle) {
            return NextResponse.json(
              { error: 'videoTitle is required for category generation' },
              { status: 400 }
            )
          }
          result = await AIMetadataService.generateCategories(
            videoTitle,
            videoDescription || ''
          )
          break

        case 'complete':
          if (!videoTitle) {
            return NextResponse.json(
              { error: 'videoTitle is required for complete metadata generation' },
              { status: 400 }
            )
          }
          result = await AIMetadataService.generateCompleteMetadata(
            videoTitle,
            videoDescription || '',
            aiOptions
          )
          break
      }

      return NextResponse.json({
        success: true,
        type,
        data: result,
        timestamp: new Date().toISOString(),
      })
    }

    // Handle legacy AI metadata generation types
    if (!type || !['video', 'clip', 'improve'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Must be: title, description, hashtags, categories, complete, video, clip, or improve' 
      }, { status: 400 })
    }

    let result
    
    switch (type) {
      case 'video':
        result = await generateVideoMetadata(legacyParams)
        break
      case 'clip':
        result = await generateClipMetadata(legacyParams)
        break
      case 'improve':
        result = await improveMetadata(legacyParams.currentMetadata, legacyParams.context)
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

// GET endpoint to check AI service status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const available = isAIAvailable()
    
    return NextResponse.json({
      available,
      models: available ? ['gpt-4o-mini'] : [],
      features: available ? ['title', 'description', 'hashtags', 'categories', 'complete'] : [],
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('AI status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check AI status', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
