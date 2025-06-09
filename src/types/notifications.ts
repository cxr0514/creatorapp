export type NotificationType = 
  | 'batch_export_success'
  | 'batch_export_failure'
  | 'new_ai_suggestion'
  | 'system_alert'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'achievement'
  | 'milestone'
  | 'reminder'
  | 'engagement'
  | 'system';

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
  link?: string; // Optional link to relevant content (e.g., the generated video)
  metadata?: Record<string, unknown>; // For extra data specific to the notification type
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  platform?: string;
  contentType?: string;
  actionUrl?: string;
}

// Export as Notification for backward compatibility
export type Notification = NotificationPayload; 