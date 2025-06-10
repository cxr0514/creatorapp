'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { LandingPage } from '@/components/landing/enhanced-landing-page'
import ModernDashboard from '@/components/dashboard/modern-dashboard'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always show content after mounting to prevent hydration issues
  if (!mounted) {
    return null
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show dashboard if authenticated
  if (status === 'authenticated' && session) {
    return <ModernDashboard />
  }

  // Show landing page if not authenticated
  return <LandingPage />
}