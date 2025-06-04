import { NextRequest, NextResponse } from 'next/server'

// Mock cross-posting rules data
const mockRules = [
  {
    id: '1',
    name: 'YouTube to TikTok Auto-Share',
    description: 'Automatically share YouTube Shorts to TikTok when they reach 1000 views',
    sourcePlatform: 'youtube',
    targetPlatforms: ['tiktok'],
    isActive: true,
    delayMinutes: 60,
    contentTransform: {
      adaptTitle: true,
      adaptDescription: true,
      adaptHashtags: true,
      customTitleSuffix: ' #YouTubeShorts',
      hashtagStrategy: 'adapt' as const
    },
    conditions: {
      minViews: 1000,
      timeWindow: 24
    },
    createdAt: new Date('2025-05-20'),
    lastTriggered: new Date('2025-05-30'),
    successCount: 15,
    failureCount: 2
  },
  {
    id: '2',
    name: 'High-Performing Content Cross-Post',
    description: 'Share content to all platforms when engagement rate exceeds 10%',
    sourcePlatform: 'instagram',
    targetPlatforms: ['twitter', 'linkedin', 'facebook'],
    isActive: true,
    delayMinutes: 30,
    contentTransform: {
      adaptTitle: true,
      adaptDescription: true,
      adaptHashtags: true,
      hashtagStrategy: 'adapt' as const
    },
    conditions: {
      minEngagementRate: 10,
      timeWindow: 12
    },
    createdAt: new Date('2025-05-25'),
    lastTriggered: new Date('2025-05-31'),
    successCount: 8,
    failureCount: 1
  },
  {
    id: '3',
    name: 'LinkedIn to Twitter Professional Share',
    description: 'Share professional content from LinkedIn to Twitter',
    sourcePlatform: 'linkedin',
    targetPlatforms: ['twitter'],
    isActive: false,
    delayMinutes: 120,
    contentTransform: {
      adaptTitle: true,
      adaptDescription: true,
      adaptHashtags: true,
      customTitleSuffix: ' #Professional',
      hashtagStrategy: 'adapt' as const
    },
    conditions: {
      minLikes: 50,
      timeWindow: 6
    },
    createdAt: new Date('2025-05-28'),
    successCount: 5,
    failureCount: 0
  }
]

// GET /api/cross-posting/rules - Get all cross-posting rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'
    
    let rules = [...mockRules]
    
    if (activeOnly) {
      rules = rules.filter(rule => rule.isActive)
    }
    
    // Sort by creation date (newest first)
    rules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({
      success: true,
      rules,
      totalCount: rules.length,
      activeCount: rules.filter(r => r.isActive).length
    })
  } catch (error) {
    console.error('Error fetching cross-posting rules:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rules' },
      { status: 500 }
    )
  }
}

// POST /api/cross-posting/rules - Create a new cross-posting rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      sourcePlatform,
      targetPlatforms,
      delayMinutes,
      contentTransform,
      conditions
    } = body
    
    // Validate required fields
    if (!name || !sourcePlatform || !targetPlatforms || targetPlatforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const newRule = {
      id: Date.now().toString(),
      name,
      description: description || '',
      sourcePlatform,
      targetPlatforms,
      isActive: true,
      delayMinutes: delayMinutes || 0,
      contentTransform: contentTransform || {
        adaptTitle: true,
        adaptDescription: true,
        adaptHashtags: true,
        hashtagStrategy: 'adapt'
      },
      conditions: conditions || {},
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0
    }
    
    // In a real implementation, save to database
    mockRules.push(newRule)
    
    return NextResponse.json({
      success: true,
      rule: newRule
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating cross-posting rule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create rule' },
      { status: 500 }
    )
  }
}
