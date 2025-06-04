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

    const userOnboarding = await prisma.userOnboarding.findUnique({
      where: { userId: params.userId }
    })

    return NextResponse.json({ 
      onboarding: userOnboarding || null 
    })
  } catch (error) {
    console.error('Failed to fetch user onboarding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const { onboardingData, preferences } = await request.json()

    if (!onboardingData) {
      return NextResponse.json({ error: 'Onboarding data required' }, { status: 400 })
    }

    // Create or update onboarding record
    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId: params.userId },
      update: {
        isCompleted: true,
        currentStep: 5,
        welcomeCompleted: true,
        goalsCompleted: true,
        platformsCompleted: true,
        preferencesCompleted: true,
        tutorialCompleted: true,
        contentGoals: onboardingData.contentGoals,
        experienceLevel: onboardingData.experienceLevel,
        contentTypes: onboardingData.contentTypes,
        postingFrequency: onboardingData.postingFrequency,
        priorityPlatforms: onboardingData.priorityPlatforms,
        audienceSize: onboardingData.audienceSize,
        interestedFeatures: onboardingData.interestedFeatures,
        completedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId: params.userId,
        isCompleted: true,
        currentStep: 5,
        totalSteps: 5,
        welcomeCompleted: true,
        goalsCompleted: true,
        platformsCompleted: true,
        preferencesCompleted: true,
        tutorialCompleted: true,
        contentGoals: onboardingData.contentGoals,
        experienceLevel: onboardingData.experienceLevel,
        contentTypes: onboardingData.contentTypes,
        postingFrequency: onboardingData.postingFrequency,
        priorityPlatforms: onboardingData.priorityPlatforms,
        audienceSize: onboardingData.audienceSize,
        interestedFeatures: onboardingData.interestedFeatures,
        completedAt: new Date()
      }
    })

    // Create user preferences based on onboarding data
    if (preferences) {
      await prisma.userPreferences.upsert({
        where: { userId: params.userId },
        update: {
          defaultAspectRatio: preferences.defaultAspectRatio,
          primaryPlatform: preferences.primaryPlatform,
          targetPlatforms: onboardingData.priorityPlatforms,
          enableAiEnhancement: preferences.enableAiEnhancement,
          autoGenerateCaptions: preferences.enableAiEnhancement,
          autoGenerateHashtags: preferences.enableAiEnhancement,
          aiTonePreference: preferences.aiTonePreference,
          videoQuality: preferences.videoQuality,
          timezone: preferences.timezone,
          emailNotifications: preferences.enableNotifications,
          pushNotifications: preferences.enableNotifications,
          updatedAt: new Date()
        },
        create: {
          userId: params.userId,
          defaultAspectRatio: preferences.defaultAspectRatio || '16:9',
          primaryPlatform: preferences.primaryPlatform,
          targetPlatforms: onboardingData.priorityPlatforms || [],
          enableAiEnhancement: preferences.enableAiEnhancement ?? true,
          autoGenerateCaptions: preferences.enableAiEnhancement ?? true,
          autoGenerateHashtags: preferences.enableAiEnhancement ?? true,
          aiTonePreference: preferences.aiTonePreference || 'professional',
          videoQuality: preferences.videoQuality || '1080p',
          timezone: preferences.timezone || 'UTC',
          emailNotifications: preferences.enableNotifications ?? true,
          pushNotifications: preferences.enableNotifications ?? true
        }
      })
    }

    return NextResponse.json({ 
      onboarding,
      message: 'Onboarding completed successfully'
    })
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
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

    const { step, data } = await request.json()

    if (step === undefined) {
      return NextResponse.json({ error: 'Step number required' }, { status: 400 })
    }

    // Update onboarding progress
    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId: params.userId },
      update: {
        currentStep: step,
        ...data,
        updatedAt: new Date()
      },
      create: {
        userId: params.userId,
        currentStep: step,
        totalSteps: 5,
        ...data
      }
    })

    return NextResponse.json({ 
      onboarding,
      message: 'Onboarding progress updated'
    })
  } catch (error) {
    console.error('Failed to update onboarding progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
