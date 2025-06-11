'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SidebarNavigation } from './navigation/sidebar-navigation'
import { Header } from './navigation/header'
import { DashboardStats } from './widgets/dashboard-stats'
import { TabContent } from './content/tab-content'

interface ScheduledPost {
  id: string
  title: string
  platform: string
  scheduledDate: string
  status: 'draft' | 'scheduled' | 'published'
}

interface Platform {
  id: string
  name: string
  connected: boolean
  optimalTimes: string[]
  audience: number
}

export default function ModernDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showVideoUpload, setShowVideoUpload] = useState(false)
  const [scheduledPosts] = useState<ScheduledPost[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [platforms] = useState<Platform[]>([
    { id: 'youtube', name: 'YouTube', connected: true, optimalTimes: ['14:00', '16:00', '20:00'], audience: 125000 },
    { id: 'tiktok', name: 'TikTok', connected: true, optimalTimes: ['18:00', '20:00', '22:00'], audience: 85000 },
    { id: 'instagram', name: 'Instagram', connected: false, optimalTimes: ['11:00', '14:00', '17:00'], audience: 0 },
    { id: 'twitter', name: 'Twitter', connected: false, optimalTimes: ['09:00', '12:00', '17:00'], audience: 0 }
  ])

  // Check if user is admin
  const isAdmin = session?.user?.email === 'admin@creatorapp.com' || false

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleUploadComplete = () => {
    setShowVideoUpload(false)
    setRefreshKey(prev => prev + 1)
  }

  const handleScheduleNew = (_date: Date) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Add scheduling logic here if needed
  }

  const handlePostSelect = (_post: ScheduledPost) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Add post selection logic here if needed
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <SidebarNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isAdmin={isAdmin}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header
          setSidebarOpen={setSidebarOpen}
          session={session}
        />

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Dashboard Stats */}
              {activeTab === 'dashboard' && (
                <DashboardStats />
              )}

              {/* Tab Content */}
              {session && (
                <TabContent
                  activeTab={activeTab}
                  session={session}
                  refreshKey={refreshKey}
                  showVideoUpload={showVideoUpload}
                  setShowVideoUpload={setShowVideoUpload}
                  handleUploadComplete={handleUploadComplete}
                  scheduledPosts={scheduledPosts}
                  handlePostSelect={handlePostSelect}
                  handleScheduleNew={handleScheduleNew}
                  platforms={platforms}
                  isMobile={isMobile}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
