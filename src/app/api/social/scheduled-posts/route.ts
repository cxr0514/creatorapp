import { NextRequest, NextResponse } from 'next/server'

// Mock data for scheduled posts
const mockScheduledPosts = [
  {
    id: '1',
    title: 'How to Create Engaging Short-Form Content',
    description: 'Learn the secrets of viral short-form content creation with these proven strategies and tips.',
    platforms: ['tiktok', 'instagram', 'youtube'],
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    status: 'scheduled' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop',
    videoUrl: 'https://example.com/video1.mp4'
  },
  {
    id: '2',
    title: 'Behind the Scenes: My Content Creation Setup',
    description: 'Take a look at my complete content creation studio and the equipment I use daily.',
    platforms: ['youtube', 'linkedin'],
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: 'scheduled' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=200&fit=crop',
    videoUrl: 'https://example.com/video2.mp4'
  },
  {
    id: '3',
    title: '5 Tools Every Creator Needs in 2025',
    description: 'Essential tools and software that will level up your content creation game this year.',
    platforms: ['twitter', 'linkedin', 'instagram'],
    scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (published)
    status: 'published' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop',
    videoUrl: 'https://example.com/video3.mp4',
    analytics: {
      views: 12450,
      likes: 892,
      shares: 156,
      comments: 89
    }
  },
  {
    id: '4',
    title: 'Common Content Creation Mistakes to Avoid',
    description: 'Learn from my mistakes! Here are the biggest content creation pitfalls and how to avoid them.',
    platforms: ['youtube', 'tiktok'],
    scheduledTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
    status: 'scheduled' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=200&fit=crop',
    videoUrl: 'https://example.com/video4.mp4'
  }
]

export async function GET() {
  try {
    // In a real implementation, you would:
    // 1. Get user ID from authentication
    // 2. Query database for user's scheduled posts
    // 3. Return paginated results
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // Convert date strings to Date objects for proper serialization
    const posts = mockScheduledPosts.map(post => ({
      ...post,
      scheduledTime: post.scheduledTime.toISOString()
    }))

    return NextResponse.json({
      success: true,
      posts: posts,
      total: posts.length,
      message: 'Scheduled posts retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch scheduled posts',
        posts: []
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, platforms, scheduledTime, videoUrl, thumbnailUrl } = body

    // Validate required fields
    if (!title || !platforms || !scheduledTime) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: title, platforms, or scheduledTime' 
        },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Validate user authentication
    // 2. Validate platform connections
    // 3. Save to database
    // 4. Schedule the actual publishing job

    const newPost = {
      id: Date.now().toString(),
      title,
      description: description || '',
      platforms,
      scheduledTime: new Date(scheduledTime).toISOString(),
      status: 'scheduled' as const,
      thumbnailUrl,
      videoUrl
    }

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Post scheduled successfully'
    })
  } catch (error) {
    console.error('Error scheduling post:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to schedule post' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Post ID is required' 
        },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Validate user authentication
    // 2. Check if user owns the post
    // 3. Remove from database
    // 4. Cancel the scheduled job

    return NextResponse.json({
      success: true,
      message: 'Scheduled post cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling scheduled post:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cancel scheduled post' 
      },
      { status: 500 }
    )
  }
}
