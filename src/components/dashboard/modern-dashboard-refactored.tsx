'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { SidebarNavigation } from './navigation/sidebar-navigation'
import { Header } from './navigation/header'
import { DashboardStats } from './widgets/dashboard-stats'
import { TabContent } from './content/tab-content'

export default function ModernDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars

  // Check if user is admin
  const isAdmin = session?.user?.email === 'admin@creatorapp.com' || false

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
              <TabContent
                activeTab={activeTab}
                session={session}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
