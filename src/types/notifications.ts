export type NotificationType = 
  | 'clip_generation_success'
  | 'clip_generation_failure'
  | 'batch_export_success'
  | 'batch_export_failure'
  | 'new_ai_suggestion'
  | 'system_alert';

export type NotificationChannel = 'email' | 'in_app';

export interface NotificationPreference {
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface UserNotificationPreferences {
  userId: string; // or number, depending on your User model
  preferences: NotificationPreference[];
  // Global enable/disable for certain channels
  globalEmailEnabled?: boolean;
  globalInAppEnabled?: boolean;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string; // Optional link to relevant content (e.g., the generated clip)
  metadata?: Record<string, any>; // For extra data specific to the notification type
} 