import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user can access this resource
    if (session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: params.userId }
    })

    return NextResponse.json({ 
      preferences: userPreferences || null 
    })
  } catch (error) {
    console.error('Failed to fetch user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user can access this resource
    if (session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { preferences } = await request.json()

    if (!preferences) {
      return NextResponse.json({ error: 'Preferences data required' }, { status: 400 })
    }

    // Upsert user preferences
    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId: params.userId },
      update: {
        defaultAspectRatio: preferences.defaultAspectRatio,
        primaryPlatform: preferences.primaryPlatform,
        targetPlatforms: preferences.targetPlatforms,
        enableAiEnhancement: preferences.enableAiEnhancement,
        autoGenerateCaptions: preferences.autoGenerateCaptions,
        autoGenerateHashtags: preferences.autoGenerateHashtags,
        aiTonePreference: preferences.aiTonePreference,
        customPrompts: preferences.customPrompts ? JSON.stringify({ prompts: preferences.customPrompts }) : null,
        videoQuality: preferences.videoQuality,
        audioQuality: preferences.audioQuality,
        compressionLevel: preferences.compressionLevel,
        defaultScheduleTime: preferences.defaultScheduleTime,
        timezone: preferences.timezone,
        enableAutoPosting: preferences.enableAutoPosting,
        crossPostingEnabled: preferences.crossPostingEnabled,
        batchProcessingEnabled: preferences.batchProcessingEnabled,
        defaultHashtagCount: preferences.defaultHashtagCount,
        defaultCaptionLength: preferences.defaultCaptionLength,
        enableTrendingHashtags: preferences.enableTrendingHashtags,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        weeklyDigest: preferences.weeklyDigest,
        processingAlerts: preferences.processingAlerts,
        schedulingReminders: preferences.schedulingReminders,
        theme: preferences.theme,
        dashboardLayout: preferences.dashboardLayout,
        updatedAt: new Date()
      },
      create: {
        userId: params.userId,
        defaultAspectRatio: preferences.defaultAspectRatio || '16:9',
        primaryPlatform: preferences.primaryPlatform,
        targetPlatforms: preferences.targetPlatforms || [],
        enableAiEnhancement: preferences.enableAiEnhancement ?? true,
        autoGenerateCaptions: preferences.autoGenerateCaptions ?? true,
        autoGenerateHashtags: preferences.autoGenerateHashtags ?? true,
        aiTonePreference: preferences.aiTonePreference || 'professional',
        customPrompts: preferences.customPrompts ? JSON.stringify({ prompts: preferences.customPrompts }) : null,
        videoQuality: preferences.videoQuality || '1080p',
        audioQuality: preferences.audioQuality || 'high',
        compressionLevel: preferences.compressionLevel || 'balanced',
        defaultScheduleTime: preferences.defaultScheduleTime || '09:00',
        timezone: preferences.timezone || 'UTC',
        enableAutoPosting: preferences.enableAutoPosting ?? false,
        crossPostingEnabled: preferences.crossPostingEnabled ?? false,
        batchProcessingEnabled: preferences.batchProcessingEnabled ?? true,
        defaultHashtagCount: preferences.defaultHashtagCount || 5,
        defaultCaptionLength: preferences.defaultCaptionLength || 'medium',
        enableTrendingHashtags: preferences.enableTrendingHashtags ?? true,
        emailNotifications: preferences.emailNotifications ?? true,
        pushNotifications: preferences.pushNotifications ?? true,
        weeklyDigest: preferences.weeklyDigest ?? true,
        processingAlerts: preferences.processingAlerts ?? true,
        schedulingReminders: preferences.schedulingReminders ?? true,
        theme: preferences.theme || 'basecom',
        dashboardLayout: preferences.dashboardLayout || 'grid'
      }
    })

    return NextResponse.json({ 
      preferences: updatedPreferences,
      message: 'Preferences updated successfully'
    })
  } catch (error) {
    console.error('Failed to update user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
