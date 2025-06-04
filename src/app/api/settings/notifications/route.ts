import { NextRequest, NextResponse } from 'next/server'

interface NotificationSettings {
  platform: string
  enabled: boolean
  publishSuccess: boolean
  publishFailed: boolean
  analytics: boolean
  mentions: boolean
  comments: boolean
  scheduledPosts: boolean
}

// In a real application, these would be stored in a database
let notificationSettings: NotificationSettings[] = []

export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database based on authenticated user
    return NextResponse.json({
      success: true,
      settings: notificationSettings
    })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { settings } = await request.json()

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    // Validate settings structure
    for (const setting of settings) {
      if (!setting.platform || typeof setting.platform !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid platform in settings' },
          { status: 400 }
        )
      }
    }

    // In production, save to database based on authenticated user
    notificationSettings = settings

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { platform, setting, value } = await request.json()

    if (!platform || !setting || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find existing setting or create new one
    const existingIndex = notificationSettings.findIndex(s => s.platform === platform)
    
    if (existingIndex >= 0) {
      notificationSettings[existingIndex] = {
        ...notificationSettings[existingIndex],
        [setting]: value
      }
    } else {
      // Create default settings for new platform
      const defaultSettings: NotificationSettings = {
        platform,
        enabled: true,
        publishSuccess: true,
        publishFailed: true,
        analytics: true,
        mentions: false,
        comments: false,
        scheduledPosts: true,
        [setting]: value
      }
      notificationSettings.push(defaultSettings)
    }

    return NextResponse.json({
      success: true,
      message: 'Notification setting updated successfully'
    })
  } catch (error) {
    console.error('Error updating notification setting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notification setting' },
      { status: 500 }
    )
  }
}
