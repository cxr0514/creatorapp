'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon,
  PlayIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  GlobeAltIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { PlatformIcon, PLATFORM_ICON_CONFIG } from '@/lib/platform-icons'

export interface OnboardingData {
  // Step 1: Welcome & Goals
  contentGoals: string[]
  experienceLevel: string
  postingFrequency: string
  
  // Step 2: Platform Preferences
  priorityPlatforms: string[]
  audienceSize: string
  
  // Step 3: Content Preferences
  contentTypes: string[]
  defaultAspectRatio: string
  primaryPlatform: string
  
  // Step 4: AI & Feature Preferences
  enableAiEnhancement: boolean
  aiTonePreference: string
  interestedFeatures: string[]
  
  // Step 5: Account Setup
  videoQuality: string
  timezone: string
  enableNotifications: boolean
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => Promise<void>
  onSkip?: () => void
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const totalSteps = 5
  
  const [data, setData] = useState<OnboardingData>({
    contentGoals: [],
    experienceLevel: '',
    postingFrequency: '',
    priorityPlatforms: [],
    audienceSize: '',
    contentTypes: [],
    defaultAspectRatio: '16:9',
    primaryPlatform: '',
    enableAiEnhancement: true,
    aiTonePreference: 'professional',
    interestedFeatures: [],
    videoQuality: '1080p',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enableNotifications: true
  })

  const contentGoalOptions = [
    { id: 'grow_audience', label: 'Grow My Audience', icon: UserGroupIcon },
    { id: 'increase_engagement', label: 'Increase Engagement', icon: ChartBarIcon },
    { id: 'save_time', label: 'Save Time Creating Content', icon: ClockIcon },
    { id: 'professional_content', label: 'Create Professional Content', icon: SparklesIcon },
    { id: 'monetize', label: 'Monetize My Content', icon: GlobeAltIcon },
    { id: 'brand_awareness', label: 'Build Brand Awareness', icon: PlayIcon }
  ]

  const experienceLevels = [
    { id: 'beginner', label: 'Beginner', description: 'New to content creation' },
    { id: 'intermediate', label: 'Intermediate', description: 'Some experience with social media' },
    { id: 'advanced', label: 'Advanced', description: 'Experienced content creator' },
    { id: 'expert', label: 'Expert', description: 'Professional creator or agency' }
  ]

  const postingFrequencies = [
    { id: 'daily', label: 'Daily', description: 'Post content every day' },
    { id: 'weekly', label: 'Weekly', description: 'Post 2-7 times per week' },
    { id: 'monthly', label: 'Monthly', description: 'Post a few times per month' },
    { id: 'as_needed', label: 'As Needed', description: 'Irregular posting schedule' }
  ]

  const contentTypeOptions = [
    { id: 'educational', label: 'Educational', description: 'Tutorials, how-tos, tips' },
    { id: 'entertainment', label: 'Entertainment', description: 'Fun, engaging content' },
    { id: 'promotional', label: 'Promotional', description: 'Product/service promotion' },
    { id: 'lifestyle', label: 'Lifestyle', description: 'Personal, behind-the-scenes' },
    { id: 'news', label: 'News & Updates', description: 'Industry news, updates' },
    { id: 'testimonials', label: 'Testimonials', description: 'Customer stories, reviews' }
  ]

  const featureOptions = [
    { id: 'ai_enhancement', label: 'AI Enhancement', description: 'Smart captions and optimization' },
    { id: 'scheduling', label: 'Content Scheduling', description: 'Auto-post to platforms' },
    { id: 'analytics', label: 'Performance Analytics', description: 'Track content performance' },
    { id: 'templates', label: 'Style Templates', description: 'Consistent branding' },
    { id: 'batch_processing', label: 'Batch Processing', description: 'Process multiple clips at once' },
    { id: 'cross_posting', label: 'Cross-Platform Posting', description: 'Post to multiple platforms' }
  ]

  const aiToneOptions = [
    { id: 'professional', label: 'Professional', description: 'Formal, business-focused' },
    { id: 'casual', label: 'Casual', description: 'Friendly, conversational' },
    { id: 'energetic', label: 'Energetic', description: 'Exciting, enthusiastic' },
    { id: 'conversational', label: 'Conversational', description: 'Natural, relatable' }
  ]

  const platformConfigs = PLATFORM_ICON_CONFIG

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.contentGoals.length > 0 && data.experienceLevel && data.postingFrequency
      case 2:
        return data.priorityPlatforms.length > 0 && data.audienceSize
      case 3:
        return data.contentTypes.length > 0 && data.defaultAspectRatio && data.primaryPlatform
      case 4:
        return data.aiTonePreference && data.interestedFeatures.length > 0
      case 5:
        return data.videoQuality && data.timezone
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      await onComplete(data)
    } catch (error) {
      console.error('Onboarding completion failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Welcome to CreatorApp!</h2>
              <p className="mt-2 text-muted">Let&apos;s get you set up for success. What are your main content goals?</p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">What do you want to achieve? (Select all that apply)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contentGoalOptions.map((goal) => (
                  <div
                    key={goal.id}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      data.contentGoals.includes(goal.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateData({ contentGoals: toggleArrayItem(data.contentGoals, goal.id) })}
                  >
                    <Checkbox 
                      checked={data.contentGoals.includes(goal.id)}
                      disabled
                    />
                    <goal.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{goal.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">What&apos;s your experience level?</Label>
              <RadioGroup 
                value={data.experienceLevel} 
                onValueChange={(value) => updateData({ experienceLevel: value })}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {experienceLevels.map((level) => (
                  <div key={level.id} className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value={level.id} id={level.id} />
                    <div className="flex-1">
                      <Label htmlFor={level.id} className="font-medium cursor-pointer">{level.label}</Label>
                      <p className="text-sm text-muted">{level.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">How often do you plan to post?</Label>
              <RadioGroup 
                value={data.postingFrequency} 
                onValueChange={(value) => updateData({ postingFrequency: value })}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {postingFrequencies.map((freq) => (
                  <div key={freq.id} className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value={freq.id} id={freq.id} />
                    <div className="flex-1">
                      <Label htmlFor={freq.id} className="font-medium cursor-pointer">{freq.label}</Label>
                      <p className="text-sm text-muted">{freq.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Platform Preferences</h2>
              <p className="mt-2 text-muted">Which platforms do you want to focus on?</p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Select your priority platforms (Choose up to 4)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(platformConfigs).map(([platformId, config]) => (
                  <div
                    key={platformId}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      data.priorityPlatforms.includes(platformId)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      if (data.priorityPlatforms.includes(platformId)) {
                        updateData({ priorityPlatforms: data.priorityPlatforms.filter(p => p !== platformId) })
                      } else if (data.priorityPlatforms.length < 4) {
                        updateData({ priorityPlatforms: [...data.priorityPlatforms, platformId] })
                      }
                    }}
                  >
                    <Checkbox 
                      checked={data.priorityPlatforms.includes(platformId)}
                      disabled
                    />
                    <PlatformIcon platformId={platformId} className="h-5 w-5" />
                    <span className="font-medium">{config.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">What&apos;s your current audience size?</Label>
              <RadioGroup 
                value={data.audienceSize} 
                onValueChange={(value) => updateData({ audienceSize: value })}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="small" id="small" />
                  <div className="flex-1">
                    <Label htmlFor="small" className="font-medium cursor-pointer">Small (0-1K)</Label>
                    <p className="text-sm text-muted">Just getting started</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="medium" id="medium" />
                  <div className="flex-1">
                    <Label htmlFor="medium" className="font-medium cursor-pointer">Medium (1K-10K)</Label>
                    <p className="text-sm text-muted">Growing audience</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="large" id="large" />
                  <div className="flex-1">
                    <Label htmlFor="large" className="font-medium cursor-pointer">Large (10K-100K)</Label>
                    <p className="text-sm text-muted">Established creator</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="enterprise" id="enterprise" />
                  <div className="flex-1">
                    <Label htmlFor="enterprise" className="font-medium cursor-pointer">Enterprise (100K+)</Label>
                    <p className="text-sm text-muted">Major creator or brand</p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Content Preferences</h2>
              <p className="mt-2 text-muted">Tell us about the type of content you create</p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">What type of content do you create? (Select all that apply)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contentTypeOptions.map((type) => (
                  <div
                    key={type.id}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      data.contentTypes.includes(type.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateData({ contentTypes: toggleArrayItem(data.contentTypes, type.id) })}
                  >
                    <Checkbox 
                      checked={data.contentTypes.includes(type.id)}
                      disabled
                    />
                    <div className="flex-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted">{type.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Default Aspect Ratio</Label>
                <Select value={data.defaultAspectRatio} onValueChange={(value) => updateData({ defaultAspectRatio: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select aspect ratio" />
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
                <Select value={data.primaryPlatform} onValueChange={(value) => updateData({ primaryPlatform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.priorityPlatforms.map((platformId) => (
                      <SelectItem key={platformId} value={platformId}>
                        <div className="flex items-center space-x-2">
                          <PlatformIcon platformId={platformId} className="h-4 w-4" />
                          <span>{PLATFORM_ICON_CONFIG[platformId]?.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">AI & Features</h2>
              <p className="mt-2 text-muted">Customize your AI assistance and feature preferences</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Enable AI Enhancement</div>
                    <div className="text-sm text-muted">Let AI help optimize your content</div>
                  </div>
                </div>
                <Checkbox 
                  checked={data.enableAiEnhancement}
                  onCheckedChange={(checked) => updateData({ enableAiEnhancement: !!checked })}
                />
              </div>
            </div>

            {data.enableAiEnhancement && (
              <div className="space-y-4">
                <Label className="text-base font-medium">AI Tone Preference</Label>
                <RadioGroup 
                  value={data.aiTonePreference} 
                  onValueChange={(value) => updateData({ aiTonePreference: value })}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {aiToneOptions.map((tone) => (
                    <div key={tone.id} className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value={tone.id} id={tone.id} />
                      <div className="flex-1">
                        <Label htmlFor={tone.id} className="font-medium cursor-pointer">{tone.label}</Label>
                        <p className="text-sm text-muted">{tone.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="space-y-4">
              <Label className="text-base font-medium">Which features interest you most? (Select all that apply)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featureOptions.map((feature) => (
                  <div
                    key={feature.id}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      data.interestedFeatures.includes(feature.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateData({ interestedFeatures: toggleArrayItem(data.interestedFeatures, feature.id) })}
                  >
                    <Checkbox 
                      checked={data.interestedFeatures.includes(feature.id)}
                      disabled
                    />
                    <div className="flex-1">
                      <div className="font-medium">{feature.label}</div>
                      <div className="text-sm text-muted">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Final Setup</h2>
              <p className="mt-2 text-muted">Just a few more preferences to get you started</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Default Video Quality</Label>
                <Select value={data.videoQuality} onValueChange={(value) => updateData({ videoQuality: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select video quality" />
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
                <Label className="text-base font-medium">Timezone</Label>
                <Input
                  type="text"
                  value={data.timezone}
                  onChange={(e) => updateData({ timezone: e.target.value })}
                  placeholder="Your timezone"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CogIcon className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Enable Notifications</div>
                    <div className="text-sm text-muted">Get updates about your content processing and performance</div>
                  </div>
                </div>
                <Checkbox 
                  checked={data.enableNotifications}
                  onCheckedChange={(checked) => updateData({ enableNotifications: !!checked })}
                />
              </div>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <CheckIcon className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-medium text-foreground">You&apos;re all set!</h3>
                    <p className="text-sm text-muted">
                      We&apos;ll use these preferences to customize your experience. You can always change them later in your settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="border-border">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <PlayIcon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">CreatorApp</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip Setup
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
              </div>
              <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {renderStep()}
          </CardContent>

          <div className="flex items-center justify-between p-6 border-t border-border">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div 
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i + 1 <= currentStep ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
                <CheckIcon className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
