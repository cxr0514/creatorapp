'use client'

import React from 'react'
import { SocialMediaNav } from '@/components/navigation/social-media-nav'
import { NotificationCenter } from '@/components/dashboard/notification-center'

interface SocialLayoutProps {
  children: React.ReactNode
}

export function SocialLayout({ children }: SocialLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <SocialMediaNav />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Social Media Integration</h1>
              <p className="text-gray-600">Manage your social media presence from one place</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter />
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
