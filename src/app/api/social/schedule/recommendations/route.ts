import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { SmartScheduler } from '@/lib/smart-scheduler'

// GET /api/social/schedule/recommendations - Get optimal posting times
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platforms = searchParams.get('platforms')?.split(',') || ['youtube', 'tiktok', 'instagram']
    const contentType = (searchParams.get('contentType') as 'video' | 'image' | 'text') || 'video'
    const targetAudience = searchParams.get('targetAudience') || 'general'
    const timezone = searchParams.get('timezone') || 'UTC'
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7')
    const excludeWeekends = searchParams.get('excludeWeekends') === 'true'
    const minHoursBetween = parseInt(searchParams.get('minHoursBetween') || '4')

    const recommendations = SmartScheduler.getOptimalTimes({
      platforms,
      contentType,
      targetAudience: targetAudience as 'general' | 'business' | 'entertainment' | 'educational',
      timezone,
      minHoursBetweenPosts: minHoursBetween,
      excludeWeekends
    }, new Date(), daysAhead)

    return NextResponse.json({ 
      recommendations: recommendations.slice(0, 20), // Return top 20
      timezone,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting schedule recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to get schedule recommendations' },
      { status: 500 }
    )
  }
}

// POST /api/social/schedule/batch - Create batch schedule for multiple posts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      platforms, 
      contentType, 
      postCount, 
      targetAudience, 
      timezone,
      startDate,
      excludeWeekends,
      minHoursBetween
    } = await request.json()

    if (!platforms || !postCount) {
      return NextResponse.json(
        { error: 'Platforms and post count are required' },
        { status: 400 }
      )
    }

    const schedule = SmartScheduler.getBatchSchedule({
      platforms,
      contentType: contentType || 'video',
      targetAudience: targetAudience || 'general',
      timezone: timezone || 'UTC',
      minHoursBetweenPosts: minHoursBetween || 4,
      excludeWeekends: excludeWeekends || false
    }, postCount, startDate ? new Date(startDate) : new Date())

    return NextResponse.json({ 
      schedule,
      totalPosts: schedule.length,
      timezone: timezone || 'UTC',
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating batch schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create batch schedule' },
      { status: 500 }
    )
  }
}
