'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, Users, Zap, AlertCircle } from 'lucide-react'
import { format, setHours, setMinutes } from 'date-fns'

interface Video {
  id: number
  title: string
  thumbnailUrl?: string | null
  duration: number | null
  storageUrl: string
}

interface Platform {
  id: string
  name: string
  connected: boolean
  optimalTimes: string[]
  audience: number
}

interface SchedulingModalProps {
  open: boolean
  onClose: () => void
  selectedDate?: Date
  selectedVideo?: Video
  platforms: Platform[]
  onSchedule: (scheduleData: ScheduleData) => void
  loading?: boolean
}

interface ScheduleData {
  videoId: number
  platforms: string[]
  scheduledTime: Date
  title: string
  description: string
  hashtags: string[]
  customizations: Record<string, unknown>
}

export function SchedulingModal({
  open,
  onClose,
  selectedDate,
  selectedVideo,
  platforms,
  onSchedule,
  loading = false
}: SchedulingModalProps) {
  const [formData, setFormData] = useState({
    videoId: selectedVideo?.id || 0,
    title: selectedVideo?.title || '',
    description: '',
    hashtags: '',
    platforms: [] as string[],
    date: selectedDate || new Date(),
    time: '12:00',
    useOptimalTime: false
  })

  const [optimalTimes, setOptimalTimes] = useState<Record<string, string>>({})

  useEffect(() => {
    if (selectedVideo) {
      setFormData(prev => ({
        ...prev,
        videoId: selectedVideo.id,
        title: selectedVideo.title
      }))
    }
  }, [selectedVideo])

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }))
    }
  }, [selectedDate])

  // Generate optimal times for selected platforms
  useEffect(() => {
    if (formData.useOptimalTime) {
      const times: Record<string, string> = {}
      formData.platforms.forEach(platformId => {
        const platform = platforms.find(p => p.id === platformId)
        if (platform && platform.optimalTimes.length > 0) {
          times[platformId] = platform.optimalTimes[0]
        }
      })
      setOptimalTimes(times)
    }
  }, [formData.platforms, formData.useOptimalTime, platforms])

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.useOptimalTime) {
      // Schedule multiple posts at optimal times
      formData.platforms.forEach(platformId => {
        const optimalTime = optimalTimes[platformId] || formData.time
        const [hours, minutes] = optimalTime.split(':').map(Number)
        const scheduledTime = setMinutes(setHours(formData.date, hours), minutes)
        
        onSchedule({
          videoId: formData.videoId,
          platforms: [platformId],
          scheduledTime,
          title: formData.title,
          description: formData.description,
          hashtags: formData.hashtags.split(',').map(h => h.trim()).filter(Boolean),
          customizations: {}
        })
      })
    } else {
      // Schedule single time for all platforms
      const [hours, minutes] = formData.time.split(':').map(Number)
      const scheduledTime = setMinutes(setHours(formData.date, hours), minutes)
      
      onSchedule({
        videoId: formData.videoId,
        platforms: formData.platforms,
        scheduledTime,
        title: formData.title,
        description: formData.description,
        hashtags: formData.hashtags.split(',').map(h => h.trim()).filter(Boolean),
        customizations: {}
      })
    }
  }

  const connectedPlatforms = platforms.filter(p => p.connected)
  const disconnectedPlatforms = platforms.filter(p => !p.connected)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Content
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Selection */}
          {selectedVideo && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {selectedVideo.thumbnailUrl && (
                    <Image
                      src={selectedVideo.thumbnailUrl}
                      alt="Video thumbnail"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{selectedVideo.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedVideo.duration ? `${Math.round(selectedVideo.duration)}s` : 'Duration unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title..."
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter post description..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                value={formData.hashtags}
                onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                placeholder="hashtag1, hashtag2, hashtag3..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate hashtags with commas
              </p>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Platforms</Label>
              {formData.platforms.length > 0 && (
                <Badge variant="outline">
                  {formData.platforms.length} selected
                </Badge>
              )}
            </div>

            {/* Connected Platforms */}
            <div className="grid grid-cols-2 gap-3">
              {connectedPlatforms.map(platform => (
                <div
                  key={platform.id}
                  className={`
                    p-3 border rounded-lg cursor-pointer transition-colors
                    ${formData.platforms.includes(platform.id) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted/50'
                    }
                  `}
                  onClick={() => handlePlatformToggle(platform.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.platforms.includes(platform.id)}
                      onChange={() => {}} // Handled by parent click
                    />
                    <div className="flex-1">
                      <div className="font-medium">{platform.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {platform.audience.toLocaleString()} followers
                      </div>
                      {formData.useOptimalTime && optimalTimes[platform.id] && (
                        <div className="text-xs text-primary flex items-center gap-1 mt-1">
                          <Zap className="h-3 w-3" />
                          Optimal: {optimalTimes[platform.id]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Disconnected Platforms */}
            {disconnectedPlatforms.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Disconnected Platforms</Label>
                <div className="grid grid-cols-2 gap-3">
                  {disconnectedPlatforms.map(platform => (
                    <div
                      key={platform.id}
                      className="p-3 border border-border rounded-lg opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{platform.name}</div>
                        <Badge variant="outline" className="text-xs">
                          Not Connected
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Connect platforms in Social Settings to schedule posts
                </p>
              </div>
            )}
          </div>

          {/* Scheduling Options */}
          <div className="space-y-4">
            <Label>Schedule Time</Label>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="date" className="text-sm">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={format(formData.date, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    date: new Date(e.target.value) 
                  }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              {!formData.useOptimalTime && (
                <div className="flex-1">
                  <Label htmlFor="time" className="text-sm">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="optimal-time"
                checked={formData.useOptimalTime}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, useOptimalTime: checked as boolean }))
                }
              />
              <Label htmlFor="optimal-time" className="text-sm">
                Use optimal posting times for each platform
              </Label>
            </div>

            {formData.useOptimalTime && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Posts will be scheduled at the best times for maximum engagement on each platform
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formData.platforms.length === 0 || loading}
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule {formData.useOptimalTime ? formData.platforms.length : 1} Post
                  {formData.useOptimalTime && formData.platforms.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
