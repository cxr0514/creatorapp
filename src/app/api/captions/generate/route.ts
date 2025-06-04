import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { generateCaptions } from '@/lib/ai'
import { aiRateLimiter } from '@/lib/rate-limiter'
import { captionsCache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const userEmail = session.user.email
    const canProceed = await aiRateLimiter.checkLimit(userEmail)
    
    if (!canProceed) {
      const timeUntilReset = aiRateLimiter.getTimeUntilReset(userEmail)
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(timeUntilReset / 1000)
      }, { status: 429 })
    }

    const { videoUrl, startTime, endTime } = await request.json()

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    // Generate cache key for captions
    const cacheKey = captionsCache.generateKey({ videoUrl, startTime, endTime })
    
    // Check cache first
    const cachedCaptions = captionsCache.get(cacheKey)
    if (cachedCaptions) {
      return NextResponse.json({
        ...cachedCaptions,
        cached: true
      })
    }

    // Generate captions using AI service
    const captions = await generateCaptions(videoUrl)
    const duration = endTime - startTime

    const result = {
      captions,
      startTime,
      endTime,
      duration
    }

    // Cache the result
    captionsCache.set(cacheKey, result)

    // Add rate limit info to response headers
    const remainingRequests = aiRateLimiter.getRemainingRequests(userEmail)
    const response = NextResponse.json(result)
    response.headers.set('X-RateLimit-Remaining', remainingRequests.toString())
    response.headers.set('X-RateLimit-Limit', '10')

    return response

  } catch (error) {
    console.error('Error generating captions:', error)
    return NextResponse.json(
      { error: 'Failed to generate captions' },
      { status: 500 }
    )
  }
}
