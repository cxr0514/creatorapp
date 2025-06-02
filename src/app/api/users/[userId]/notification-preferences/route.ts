import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserNotificationPreferences, NotificationPreference, NotificationType, NotificationChannel } from '@/types/notifications';

// In-memory store for mock preferences
const mockUserPreferences: Record<string, UserNotificationPreferences> = {};

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'clip_generation_success',
  'clip_generation_failure',
  'batch_export_success',
  'batch_export_failure',
  'new_ai_suggestion',
  'system_alert'
];

const DEFAULT_CHANNELS: NotificationChannel[] = ['email', 'in_app'];

function getDefaultPreferences(userId: string): UserNotificationPreferences {
  return {
    userId,
    globalEmailEnabled: true,
    globalInAppEnabled: true,
    preferences: ALL_NOTIFICATION_TYPES.map(type => ({
      type,
      channels: DEFAULT_CHANNELS,
      enabled: true, // Default to enabled for most types
    })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  if (!mockUserPreferences[userId]) {
    // Initialize with defaults if not found (in a real app, fetch from DB)
    mockUserPreferences[userId] = getDefaultPreferences(userId);
  }

  return NextResponse.json(mockUserPreferences[userId]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json() as Partial<UserNotificationPreferences>;
    
    // In a real app, validate the body and update the DB
    const currentPrefs = mockUserPreferences[userId] || getDefaultPreferences(userId);
    
    mockUserPreferences[userId] = {
      ...currentPrefs,
      ...body,
      // Ensure preferences array is merged correctly if provided partially
      preferences: body.preferences ? body.preferences.map(p => {
        const existingP = currentPrefs.preferences.find(ep => ep.type === p.type);
        return { ...existingP, ...p } as NotificationPreference;
      }) : currentPrefs.preferences,
      userId, // Ensure userId is not overridden by body
    };

    return NextResponse.json(mockUserPreferences[userId]);
  } catch (error) {
    console.error('[NOTIFICATION_PREFS_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 });
  }
} 