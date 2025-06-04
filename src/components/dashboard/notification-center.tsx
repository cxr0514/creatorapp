'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, X, CheckCircle, AlertCircle, Clock, TrendingUp, Share2 } from 'lucide-react'
import { PlatformIcon } from '@/lib/platform-icons'
import { Notification } from '@/types/notifications'

// Type guard for metadata properties
interface NotificationMetadata {
  publishStatus?: 'published' | 'failed' | 'pending' | 'scheduled';
  views?: number;
  engagement?: number;
  analytics?: {
    likes?: number;
    comments?: number;
  };
  scheduledTime?: string;
}

// Helper function to safely access metadata
const getMetadata = (metadata: Record<string, unknown> | undefined): NotificationMetadata => {
  if (!metadata) return {};
  return metadata as NotificationMetadata;
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    // Set up real-time updates (in a real app, this would be WebSocket or SSE)
    const interval = setInterval(loadNotifications, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT'
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: Notification['type'], platform?: string, category?: string) => {
    if (platform) {
      return <PlatformIcon platformId={platform} size="sm" />
    }

    // Category-specific icons
    if (category) {
      switch (category) {
        case 'publishing':
          return <Share2 className="w-5 h-5 text-blue-500" />
        case 'analytics':
          return <TrendingUp className="w-5 h-5 text-purple-500" />
        case 'social':
          return <Bell className="w-5 h-5 text-green-500" />
        case 'system':
          return <Clock className="w-5 h-5 text-gray-500" />
      }
    }

    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <TrendingUp className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityBorderColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-600'
      case 'high':
        return 'border-l-orange-500'
      case 'medium':
        return 'border-l-blue-500'
      case 'low':
        return 'border-l-gray-400'
      default:
        return 'border-l-gray-300'
    }
  }

  const getNotificationTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50'
      case 'error':
        return 'bg-red-50'
      case 'warning':
        return 'bg-yellow-50'
      case 'info':
        return 'bg-blue-50'
      default:
        return 'bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityBorderColor(notification.priority)} ${getNotificationTypeColor(notification.type)} ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type, notification.platform, notification.category)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              {notification.priority === 'urgent' && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                  Urgent
                                </span>
                              )}
                              {notification.priority === 'high' && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                  High
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            {/* Publishing Status */}
                            {(() => {
                              const metadata = getMetadata(notification.metadata);
                              return metadata.publishStatus && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    metadata.publishStatus === 'published' ? 'bg-green-100 text-green-800' :
                                    metadata.publishStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                    metadata.publishStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {metadata.publishStatus === 'published' && <CheckCircle className="w-3 h-3" />}
                                    {metadata.publishStatus === 'failed' && <AlertCircle className="w-3 h-3" />}
                                    {metadata.publishStatus === 'pending' && <Clock className="w-3 h-3" />}
                                    {metadata.publishStatus === 'scheduled' && <Clock className="w-3 h-3" />}
                                    {String(metadata.publishStatus)}
                                  </span>
                                  {notification.contentType && (
                                    <span className="text-xs text-gray-500 capitalize">
                                      {notification.contentType}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                            
                            {/* Enhanced Metadata */}
                            {(() => {
                              const metadata = getMetadata(notification.metadata);
                              return notification.metadata && (
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  {metadata.views && (
                                    <span className="flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      {metadata.views.toLocaleString()} views
                                    </span>
                                  )}
                                  {metadata.engagement && (
                                    <span className="flex items-center gap-1">
                                      <Share2 className="w-3 h-3" />
                                      {metadata.engagement}% engagement
                                    </span>
                                  )}
                                  {metadata.analytics && (
                                    <>
                                      {metadata.analytics.likes && (
                                        <span className="flex items-center gap-1">
                                          ❤️ {metadata.analytics.likes.toLocaleString()}
                                        </span>
                                      )}
                                      {metadata.analytics.comments && (
                                        <span className="flex items-center gap-1">
                                          💬 {metadata.analytics.comments.toLocaleString()}
                                        </span>
                                      )}
                                    </>
                                  )}
                                  {metadata.scheduledTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(metadata.scheduledTime).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 h-auto"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs h-auto p-1"
                            >
                              Mark as read
                            </Button>
                          )}
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                window.open(notification.actionUrl, '_blank')
                                markAsRead(notification.id)
                              }}
                              className="text-xs h-auto p-1 text-blue-600"
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
