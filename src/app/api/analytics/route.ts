import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import type { 
  AnalyticsData, 
  TimeRange, 
  Platform, 
  AnalyticsApiResponse,
  AnalyticsApiError 
} from '@/lib/types/analytics'
import { 
  VALID_TIME_RANGES, 
  VALID_PLATFORMS, 
  ERROR_MESSAGES 
} from '@/lib/analytics-constants'
import { isValidPlatform, isValidTimeRange } from '@/lib/utils/analytics'
import { generateMockAnalyticsData } from '@/lib/utils/mock-data'

/**
 * Validates API request parameters
 */
function validateRequestParams(timeRange: string, platform: string): { isValid: boolean; error?: string } {
  if (!isValidTimeRange(timeRange)) {
    return { 
      isValid: false, 
      error: `${ERROR_MESSAGES.validationError}: Valid time ranges: ${VALID_TIME_RANGES.join(', ')}` 
    }
  }
  
  if (!isValidPlatform(platform)) {
    return { 
      isValid: false, 
      error: `${ERROR_MESSAGES.validationError}: Valid platforms: ${VALID_PLATFORMS.join(', ')}` 
    }
  }
  
  return { isValid: true }
}

/**
 * Creates error response
 */
function createErrorResponse(message: string, code: string, status: number = 400): NextResponse<AnalyticsApiError> {
  return NextResponse.json({
    success: false,
    error: {
      message,
      code,
      details: status === 401 ? 'Please authenticate to access analytics data' : undefined
    },
    timestamp: new Date().toISOString()
  }, { status })
}

/**
 * Creates success response
 */
function createSuccessResponse(data: AnalyticsData): NextResponse<AnalyticsApiResponse> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  })
}

/**
 * GET handler for analytics data
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse(ERROR_MESSAGES.unauthorized, 'UNAUTHORIZED', 401)
    }

    // Extract and validate query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    const platform = searchParams.get('platform') || 'all'

    const validation = validateRequestParams(timeRange, platform)
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 'VALIDATION_ERROR')
    }

    // Generate analytics data (in production, this would fetch from actual APIs)
    const analyticsData = generateMockAnalyticsData(timeRange as TimeRange, platform as Platform)
    
    return createSuccessResponse(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return createErrorResponse(
      ERROR_MESSAGES.fetchFailed, 
      'INTERNAL_ERROR', 
      500
    )
  }
}

/**
 * POST handler for analytics actions (future implementation)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse(ERROR_MESSAGES.unauthorized, 'UNAUTHORIZED', 401)
    }

    const body = await request.json()
    const { action } = body

    // Placeholder for future analytics actions (tracking, exports, etc.)
    if (action === 'track_engagement') {
      // Track engagement event
      return NextResponse.json({ success: true, message: 'Engagement tracked' })
    }

    return createErrorResponse(ERROR_MESSAGES.invalidAction, 'INVALID_ACTION')
  } catch (error) {
    console.error('Analytics action error:', error)
    return createErrorResponse(
      ERROR_MESSAGES.actionFailed, 
      'INTERNAL_ERROR', 
      500
    )
  }
}
