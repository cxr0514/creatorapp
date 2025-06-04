'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  SparklesIcon,
  VideoCameraIcon,
  ClockIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { PlatformIcon, getAllPlatformConfigs } from '@/lib/platform-icons'

interface UserPreferences {
  // Default Platform Settings
  defaultAspectRatio: string
  primaryPlatform: string
  targetPlatforms: string[]
  
  // AI Enhancement Preferences
  enableAiEnhancement: boolean
  autoGenerateCaptions: boolean
  autoGenerateHashtags: boolean
  aiTonePreference: string
  customPrompts: string
  
  // Export Quality Settings
  videoQuality: string
  audioQuality: string
  compressionLevel: string
  
  // Scheduling & Automation Preferences
  defaultScheduleTime: string
  timezone: string
  enableAutoPosting: boolean
  crossPostingEnabled: boolean
  batchProcessingEnabled: boolean
  
  // Content Creation Defaults
  defaultHashtagCount: number
  defaultCaptionLength: string
  enableTrendingHashtags: boolean
  
  // Notification Preferences
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  processingAlerts: boolean
  schedulingReminders: boolean
  
  // Theme & UI Preferences
  theme: string
  dashboardLayout: string
}

interface UserPreferencesFormProps {
  userId: string
}

export function UserPreferencesForm({ userId }: UserPreferencesFormProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultAspectRatio: '16:9',
    primaryPlatform: '',
    targetPlatforms: [],
    enableAiEnhancement: true,
    autoGenerateCaptions: true,
    autoGenerateHashtags: true,
    aiTonePreference: 'professional',
    customPrompts: '',
    videoQuality: '1080p',
    audioQuality: 'high',
    compressionLevel: 'balanced',
    defaultScheduleTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enableAutoPosting: false,
    crossPostingEnabled: false,
    batchProcessingEnabled: true,
    defaultHashtagCount: 5,
    defaultCaptionLength: 'medium',
    enableTrendingHashtags: true,
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    processingAlerts: true,
    schedulingReminders: true,
    theme: 'basecom',
    dashboardLayout: 'grid'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState('')

  const platformConfigs = getAllPlatformConfigs()

  const loadPreferences = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/users/${userId}/preferences`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(prev => ({ ...prev, ...data.preferences }))
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }, [userId])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const savePreferences = async () => {
    if (!userId) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      })

      if (response.ok) {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreference = (key: keyof UserPreferences, value: string | boolean | number | string[]) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    setIsSaved(false)
  }

  const togglePlatform = (platformId: string) => {
    const newTargetPlatforms = preferences.targetPlatforms.includes(platformId)
      ? preferences.targetPlatforms.filter(p => p !== platformId)
      : [...preferences.targetPlatforms, platformId]
    
    updatePreference('targetPlatforms', newTargetPlatforms)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Preferences</h2>
          <p className="text-muted mt-1">Customize your CreatorApp experience</p>
        </div>
        <div className="flex items-center space-x-2">
          {isSaved && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckIcon className="h-4 w-4" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span className="text-sm">Error</span>
            </div>
          )}
          <Button onClick={savePreferences} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="quality">Export Quality</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="interface">Interface</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GlobeAltIcon className="h-5 w-5" />
                <span>Platform Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Default Aspect Ratio</Label>
                  <Select 
                    value={preferences.defaultAspectRatio} 
                    onValueChange={(value) => updatePreference('defaultAspectRatio', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (YouTube, Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (TikTok, Instagram Stories)</SelectItem>
                      <SelectItem value="1:1">1:1 (Instagram Square)</SelectItem>
                      <SelectItem value="4:3">4:3 (Traditional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Primary Platform</Label>
                  <Select 
                    value={preferences.primaryPlatform} 
                    onValueChange={(value) => updatePreference('primaryPlatform', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformConfigs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          <div className="flex items-center space-x-2">
                            <PlatformIcon platformId={config.id} className="h-4 w-4" />
                            <span>{config.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Target Platforms</Label>
                <p className="text-sm text-muted">Select platforms you regularly post to</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platformConfigs.map((config) => (
                    <div
                      key={config.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        preferences.targetPlatforms.includes(config.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => togglePlatform(config.id)}
                    >
                      <PlatformIcon platformId={config.id} className="h-5 w-5" />
                      <span className="font-medium text-sm">{config.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SparklesIcon className="h-5 w-5" />
                <span>AI Enhancement Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable AI Enhancement</Label>
                  <p className="text-sm text-muted">Let AI help optimize your content</p>
                </div>
                <Switch
                  checked={preferences.enableAiEnhancement}
                  onCheckedChange={(checked) => updatePreference('enableAiEnhancement', checked)}
                />
              </div>

              {preferences.enableAiEnhancement && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Auto-Generate Captions</Label>
                        <p className="text-sm text-muted">Automatically create captions for clips</p>
                      </div>
                      <Switch
                        checked={preferences.autoGenerateCaptions}
                        onCheckedChange={(checked) => updatePreference('autoGenerateCaptions', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Auto-Generate Hashtags</Label>
                        <p className="text-sm text-muted">Automatically suggest relevant hashtags</p>
                      </div>
                      <Switch
                        checked={preferences.autoGenerateHashtags}
                        onCheckedChange={(checked) => updatePreference('autoGenerateHashtags', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">AI Tone Preference</Label>
                    <RadioGroup
                      value={preferences.aiTonePreference}
                      onValueChange={(value: string) => updatePreference('aiTonePreference', value)}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="professional" id="professional" />
                        <Label htmlFor="professional" className="cursor-pointer">Professional</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="casual" id="casual" />
                        <Label htmlFor="casual" className="cursor-pointer">Casual</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="energetic" id="energetic" />
                        <Label htmlFor="energetic" className="cursor-pointer">Energetic</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="conversational" id="conversational" />
                        <Label htmlFor="conversational" className="cursor-pointer">Conversational</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Custom AI Prompts</Label>
                    <p className="text-sm text-muted">Add specific instructions for AI to follow</p>
                    <Textarea
                      value={preferences.customPrompts}
                      onChange={(e) => updatePreference('customPrompts', e.target.value)}
                      placeholder="e.g., Always include a call-to-action, Use industry-specific terminology, Keep tone professional but approachable..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <VideoCameraIcon className="h-5 w-5" />
                <span>Export Quality Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Video Quality</Label>
                  <Select 
                    value={preferences.videoQuality} 
                    onValueChange={(value) => updatePreference('videoQuality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      <SelectItem value="1440p">1440p (2K)</SelectItem>
                      <SelectItem value="4K">4K (Ultra HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Audio Quality</Label>
                  <Select 
                    value={preferences.audioQuality} 
                    onValueChange={(value) => updatePreference('audioQuality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (128 kbps)</SelectItem>
                      <SelectItem value="medium">Medium (256 kbps)</SelectItem>
                      <SelectItem value="high">High (320 kbps)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Compression Level</Label>
                  <Select 
                    value={preferences.compressionLevel} 
                    onValueChange={(value) => updatePreference('compressionLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_quality">High Quality</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="high_compression">High Compression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5" />
                <span>Scheduling & Automation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Default Schedule Time</Label>
                  <Input
                    type="time"
                    value={preferences.defaultScheduleTime}
                    onChange={(e) => updatePreference('defaultScheduleTime', e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Timezone</Label>
                  <Input
                    type="text"
                    value={preferences.timezone}
                    onChange={(e) => updatePreference('timezone', e.target.value)}
                    placeholder="Your timezone"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Auto-Posting</Label>
                    <p className="text-sm text-muted">Automatically post scheduled content</p>
                  </div>
                  <Switch
                    checked={preferences.enableAutoPosting}
                    onCheckedChange={(checked) => updatePreference('enableAutoPosting', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Cross-Platform Posting</Label>
                    <p className="text-sm text-muted">Post to multiple platforms simultaneously</p>
                  </div>
                  <Switch
                    checked={preferences.crossPostingEnabled}
                    onCheckedChange={(checked) => updatePreference('crossPostingEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Batch Processing</Label>
                    <p className="text-sm text-muted">Process multiple clips at once</p>
                  </div>
                  <Switch
                    checked={preferences.batchProcessingEnabled}
                    onCheckedChange={(checked) => updatePreference('batchProcessingEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BellIcon className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Weekly Digest</Label>
                    <p className="text-sm text-muted">Weekly summary of your activity</p>
                  </div>
                  <Switch
                    checked={preferences.weeklyDigest}
                    onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Processing Alerts</Label>
                    <p className="text-sm text-muted">Notifications when processing completes</p>
                  </div>
                  <Switch
                    checked={preferences.processingAlerts}
                    onCheckedChange={(checked) => updatePreference('processingAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Scheduling Reminders</Label>
                    <p className="text-sm text-muted">Reminders for scheduled posts</p>
                  </div>
                  <Switch
                    checked={preferences.schedulingReminders}
                    onCheckedChange={(checked) => updatePreference('schedulingReminders', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interface" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PaintBrushIcon className="h-5 w-5" />
                <span>Interface & Theme</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Theme</Label>
                  <Select 
                    value={preferences.theme} 
                    onValueChange={(value) => updatePreference('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basecom">Basecom (Default)</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Dashboard Layout</Label>
                  <Select 
                    value={preferences.dashboardLayout} 
                    onValueChange={(value) => updatePreference('dashboardLayout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid View</SelectItem>
                      <SelectItem value="list">List View</SelectItem>
                      <SelectItem value="compact">Compact View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Default Hashtag Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={preferences.defaultHashtagCount}
                    onChange={(e) => updatePreference('defaultHashtagCount', parseInt(e.target.value) || 5)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Default Caption Length</Label>
                  <Select 
                    value={preferences.defaultCaptionLength} 
                    onValueChange={(value) => updatePreference('defaultCaptionLength', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (1-2 sentences)</SelectItem>
                      <SelectItem value="medium">Medium (3-5 sentences)</SelectItem>
                      <SelectItem value="long">Long (6+ sentences)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Trending Hashtags</Label>
                  <p className="text-sm text-muted">Include trending hashtags in suggestions</p>
                </div>
                <Switch
                  checked={preferences.enableTrendingHashtags}
                  onCheckedChange={(checked) => updatePreference('enableTrendingHashtags', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
