import { NextRequest, NextResponse } from 'next/server'

// Mock cross-posting executions data
const mockExecutions = [
  {
    id: '1',
    ruleId: '1',
    sourcePostId: 'yt_123',
    sourcePlatform: 'youtube',
    targetPlatform: 'tiktok',
    status: 'success' as const,
    scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    executedTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 minutes after scheduled
    sourceContent: {
      title: '5 AI Tools Every Creator Needs',
      description: 'Here are the best AI tools for content creation in 2025',
      hashtags: ['AI', 'ContentCreation', 'Tools'],
      videoUrl: 'https://example.com/video1.mp4',
      thumbnailUrl: 'https://example.com/thumb1.jpg'
    },
    adaptedContent: {
      title: '5 AI Tools Every Creator Needs #YouTubeShorts',
      description: 'Here are the best AI tools for content creation in 2025 🔥 #AITools #ContentCreator #TechTips',
      hashtags: ['AITools', 'ContentCreator', 'TechTips'],
      videoUrl: 'https://example.com/video1.mp4',
      thumbnailUrl: 'https://example.com/thumb1.jpg'
    }
  },
  {
    id: '2',
    ruleId: '2',
    sourcePostId: 'ig_456',
    sourcePlatform: 'instagram',
    targetPlatform: 'twitter',
    status: 'processing' as const,
    scheduledTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    sourceContent: {
      title: 'Behind the Scenes: Content Creation Setup',
      description: 'My minimal setup for creating professional content',
      hashtags: ['BehindTheScenes', 'ContentCreation', 'Setup'],
      videoUrl: 'https://example.com/video2.mp4',
      thumbnailUrl: 'https://example.com/thumb2.jpg'
    },
    adaptedContent: {
      title: 'Behind the Scenes: Content Creation Setup',
      description: 'My minimal setup for creating professional content 📸 Thread below 👇',
      hashtags: ['BehindTheScenes', 'ContentCreation', 'CreatorTips'],
      videoUrl: 'https://example.com/video2.mp4',
      thumbnailUrl: 'https://example.com/thumb2.jpg'
    }
  },
  {
    id: '3',
    ruleId: '1',
    sourcePostId: 'yt_789',
    sourcePlatform: 'youtube',
    targetPlatform: 'tiktok',
    status: 'failed' as const,
    scheduledTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    executedTime: new Date(Date.now() - 6 * 60 * 60 * 1000 + 2 * 60 * 1000), // 2 minutes after scheduled
    error: 'Video format not supported by target platform',
    sourceContent: {
      title: 'Long Form Content Strategy',
      description: 'How to create engaging long-form content',
      hashtags: ['Strategy', 'LongForm', 'Content'],
      videoUrl: 'https://example.com/video3.mp4',
      thumbnailUrl: 'https://example.com/thumb3.jpg'
    },
    adaptedContent: {
      title: 'Long Form Content Strategy #YouTubeShorts',
      description: 'How to create engaging long-form content 💪 #ContentStrategy #CreatorTips',
      hashtags: ['ContentStrategy', 'CreatorTips', 'LongForm'],
      videoUrl: 'https://example.com/video3.mp4',
      thumbnailUrl: 'https://example.com/thumb3.jpg'
    }
  },
  {
    id: '4',
    ruleId: '2',
    sourcePostId: 'ig_012',
    sourcePlatform: 'instagram',
    targetPlatform: 'linkedin',
    status: 'pending' as const,
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    sourceContent: {
      title: 'Professional Growth Tips for Creators',
      description: 'Essential tips for building a professional creator brand',
      hashtags: ['Professional', 'Growth', 'Creator'],
      videoUrl: 'https://example.com/video4.mp4',
      thumbnailUrl: 'https://example.com/thumb4.jpg'
    },
    adaptedContent: {
      title: 'Professional Growth Tips for Creators',
      description: 'Essential tips for building a professional creator brand. What strategies have worked best for you?',
      hashtags: ['ProfessionalGrowth', 'CreatorEconomy', 'PersonalBrand'],
      videoUrl: 'https://example.com/video4.mp4',
      thumbnailUrl: 'https://example.com/thumb4.jpg'
    }
  }
]

// GET /api/cross-posting/executions - Get all cross-posting executions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const ruleId = searchParams.get('ruleId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let executions = [...mockExecutions]
    
    // Filter by status
    if (status) {
      executions = executions.filter(exec => exec.status === status)
    }
    
    // Filter by rule ID
    if (ruleId) {
      executions = executions.filter(exec => exec.ruleId === ruleId)
    }
    
    // Sort by scheduled time (newest first)
    executions.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
    
    // Apply limit
    executions = executions.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      executions,
      totalCount: executions.length,
      statusCounts: {
        pending: mockExecutions.filter(e => e.status === 'pending').length,
        processing: mockExecutions.filter(e => e.status === 'processing').length,
        success: mockExecutions.filter(e => e.status === 'success').length,
        failed: mockExecutions.filter(e => e.status === 'failed').length
      }
    })
  } catch (error) {
    console.error('Error fetching cross-posting executions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch executions' },
      { status: 500 }
    )
  }
}

// POST /api/cross-posting/executions - Create a new execution (trigger cross-post)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      ruleId,
      sourcePostId,
      sourcePlatform,
      targetPlatform,
      sourceContent,
      delayMinutes = 0
    } = body
    
    if (!ruleId || !sourcePostId || !sourcePlatform || !targetPlatform || !sourceContent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // In a real implementation, you would:
    // 1. Apply content transformation based on rule settings
    // 2. Schedule the actual cross-post
    // 3. Save to database
    
    const scheduledTime = new Date(Date.now() + delayMinutes * 60 * 1000)
    
    const newExecution = {
      id: Date.now().toString(),
      ruleId,
      sourcePostId,
      sourcePlatform,
      targetPlatform,
      status: 'pending' as const,
      scheduledTime,
      sourceContent,
      adaptedContent: sourceContent // For demo, just copy source content
    }
    
    mockExecutions.unshift(newExecution)
    
    return NextResponse.json({
      success: true,
      execution: newExecution
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating cross-posting execution:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create execution' },
      { status: 500 }
    )
  }
}
