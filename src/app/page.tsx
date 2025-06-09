'use client'

import { useSession } from 'next-auth/react'
import ModernDashboard from '@/components/dashboard/modern-dashboard'
import { LandingPage } from '@/components/landing/enhanced-landing-page'

export default function HomePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return <ModernDashboard />
  }

  return <LandingPage />
}