'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Eye } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns'

interface ScheduledPost {
  id: string
  videoId: number
  platform: string
  scheduledTime: Date
  status: 'pending' | 'published' | 'failed'
  title: string
  thumbnailUrl?: string
}

interface CalendarWidgetProps {
  scheduledPosts: ScheduledPost[]
  onDateSelect: (date: Date) => void
  onPostSelect: (post: ScheduledPost) => void
  onScheduleNew: (date: Date) => void
}

export function CalendarWidget({ 
  scheduledPosts, 
  onDateSelect, 
  onPostSelect, 
  onScheduleNew 
}: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => 
      isSameDay(new Date(post.scheduledTime), date)
    )
  }

  const getPlatformColor = (platform: string) => {
    const colors = {
      youtube: 'bg-accent-danger',
      instagram: 'bg-accent-warning',
      tiktok: 'bg-black',
      twitter: 'bg-primary',
      linkedin: 'bg-primary'
    }
    return colors[platform as keyof typeof colors] || 'bg-muted-foreground'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'border-accent-warning',
      published: 'border-accent-success',
      failed: 'border-accent-danger'
    }
    return colors[status as keyof typeof colors] || 'border-muted-foreground'
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateSelect(date)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Publishing Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              ←
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              →
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date: Date) => {
            const postsForDay = getPostsForDate(date)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isTodayDate = isToday(date)

            return (
              <div
                key={date.toISOString()}
                className={`
                  min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors
                  ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isTodayDate ? 'border-primary/50 bg-primary/5' : 'border-border'}
                `}
                onClick={() => handleDateClick(date)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isTodayDate ? 'font-bold text-primary' : ''}`}>
                    {format(date, 'd')}
                  </span>
                  {postsForDay.length === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onScheduleNew(date)
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Scheduled posts for this day */}
                <div className="space-y-1">
                  {postsForDay.slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      className={`
                        text-xs p-1 rounded border-l-2 bg-white/80 cursor-pointer
                        hover:bg-white transition-colors
                        ${getStatusColor(post.status)}
                      `}
                      onClick={(e) => {
                        e.stopPropagation()
                        onPostSelect(post)
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getPlatformColor(post.platform)}`} />
                        <span className="truncate flex-1">{post.title}</span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {format(new Date(post.scheduledTime), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  
                  {postsForDay.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{postsForDay.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected date details */}
        {selectedDate && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>
            
            {getPostsForDate(selectedDate).length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No posts scheduled for this day.
                <Button
                  size="sm"
                  className="ml-2"
                  onClick={() => onScheduleNew(selectedDate)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Schedule Post
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {getPostsForDate(selectedDate).map(post => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getPlatformColor(post.platform)}`} />
                      <div>
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(post.scheduledTime), 'HH:mm')} • {post.platform}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={post.status === 'published' ? 'default' : 'outline'}
                        className={post.status === 'failed' ? 'border-accent-danger text-accent-danger' : ''}
                      >
                        {post.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPostSelect(post)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
