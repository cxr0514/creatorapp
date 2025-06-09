'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserNotificationPreferences, NotificationType, NotificationChannel } from '@/types/notifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Assuming sonner for toast notifications

interface NotificationSettingsFormProps {
  userId: string; // Or however you get the current user ID
}

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'batch_export_success',
  'batch_export_failure',
  'new_ai_suggestion',
  // 'system_alert' // System alerts are usually not user-configurable
];

const CHANNEL_DISPLAY_NAMES: Record<NotificationChannel, string> = {
  email: 'Email',
  in_app: 'In-App',
};

const TYPE_DISPLAY_NAMES: Record<NotificationType, string> = {
  batch_export_success: 'Batch Export Completed',
  batch_export_failure: 'Batch Export Failed',
  new_ai_suggestion: 'New AI Suggestions Available',
  system_alert: 'Important System Alerts',
  success: 'Success Notifications',
  error: 'Error Notifications',
  warning: 'Warning Notifications',
  info: 'Information Notifications',
  achievement: 'Achievement Notifications',
  milestone: 'Milestone Notifications',
  reminder: 'Reminder Notifications',
  engagement: 'Engagement Notifications',
  system: 'System Notifications',
};

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ userId }) => {
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/notification-preferences`);
      if (!response.ok) throw new Error('Failed to load preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load settings');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchPreferences();
  }, [userId, fetchPreferences]);

  const handleGlobalToggle = (channel: NotificationChannel, checked: boolean) => {
    setPreferences(prev => prev ? {
      ...prev,
      [channel === 'email' ? 'globalEmailEnabled' : 'globalInAppEnabled']: checked,
    } : null);
  };

  const handlePreferenceChange = (type: NotificationType, enabled: boolean) => {
    setPreferences(prev => prev ? {
      ...prev,
      preferences: prev.preferences.map(p => 
        p.type === type ? { ...p, enabled } : p
      ),
    } : null);
  };

  const handleChannelChange = (type: NotificationType, channel: NotificationChannel, checked: boolean) => {
    setPreferences(prev => prev ? {
      ...prev,
      preferences: prev.preferences.map(p => 
        p.type === type ? {
          ...p,
          channels: checked ? [...p.channels, channel] : p.channels.filter(c => c !== channel)
        } : p
      ),
    } : null);
  };

  const handleSaveChanges = async () => {
    if (!preferences) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}/notification-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save preferences');
      }
      toast.success('Notification preferences saved!');
      fetchPreferences(); // Re-fetch to confirm changes from server
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading notification settings...</div>;
  if (!preferences) return <div>Could not load settings. Please try again.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications from CreatorApp.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Global Settings</h4>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="globalEmailEnabled" className="flex flex-col space-y-1">
              <span>Enable Email Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive all enabled email notifications.
              </span>
            </Label>
            <Switch 
              id="globalEmailEnabled" 
              checked={preferences.globalEmailEnabled}
              onCheckedChange={(checked: boolean) => handleGlobalToggle('email', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md">
            <Label htmlFor="globalInAppEnabled" className="flex flex-col space-y-1">
              <span>Enable In-App Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive all enabled in-app notifications.
              </span>
            </Label>
            <Switch 
              id="globalInAppEnabled" 
              checked={preferences.globalInAppEnabled}
              onCheckedChange={(checked: boolean) => handleGlobalToggle('in_app', checked)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Detailed Preferences</h4>
          {ALL_NOTIFICATION_TYPES.map(type => {
            const pref = preferences.preferences.find(p => p.type === type);
            if (!pref) return null;
            return (
              <div key={type} className="p-3 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={`switch-${type}`} className="text-sm font-medium">{TYPE_DISPLAY_NAMES[type]}</Label>
                  <Switch 
                    id={`switch-${type}`}
                    checked={pref.enabled}
                    onCheckedChange={(checked: boolean) => handlePreferenceChange(type, checked)}
                  />
                </div>
                {pref.enabled && (
                  <div className="pl-6 mt-2 space-y-2 text-sm">
                    <p className="text-muted-foreground">Notify via:</p>
                    {(['email', 'in_app'] as NotificationChannel[]).map(channel => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`checkbox-${type}-${channel}`}
                          checked={pref.channels.includes(channel)}
                          onCheckedChange={(checked: boolean) => handleChannelChange(type, channel, !!checked)}
                        />
                        <Label htmlFor={`checkbox-${type}-${channel}`}>{CHANNEL_DISPLAY_NAMES[channel]}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsForm; 