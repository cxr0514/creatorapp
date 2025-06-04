'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import type { OnboardingData } from '@/components/onboarding/onboarding-flow'
import { checkUserOnboardingStatus, completeUserOnboarding, UserOnboardingStatus } from '@/lib/onboarding-utils'

interface OnboardingWrapperProps {
  children: React.ReactNode
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { data: session } = useSession()
  const [onboardingStatus, setOnboardingStatus] = useState<UserOnboardingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const status = await checkUserOnboardingStatus(session.user.id)
        setOnboardingStatus(status)
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
        // Default to not showing onboarding if there's an error
        setOnboardingStatus({
          isCompleted: true,
          currentStep: null,
          shouldShowOnboarding: false
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkOnboarding()
  }, [session?.user?.id])

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!session?.user?.id) return

    try {
      // Save onboarding data and mark as completed
      await completeUserOnboarding(session.user.id, data)
      
      // Update local state to hide onboarding
      setOnboardingStatus({
        isCompleted: true,
        currentStep: null,
        shouldShowOnboarding: false
      })
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      // Still hide onboarding to prevent being stuck
      setOnboardingStatus({
        isCompleted: true,
        currentStep: null,
        shouldShowOnboarding: false
      })
    }
  }

  const handleSkipOnboarding = async () => {
    if (!session?.user?.id) return

    try {
      await completeUserOnboarding(session.user.id)
      setOnboardingStatus({
        isCompleted: true,
        currentStep: null,
        shouldShowOnboarding: false
      })
    } catch (error) {
      console.error('Failed to skip onboarding:', error)
      // Still hide onboarding
      setOnboardingStatus({
        isCompleted: true,
        currentStep: null,
        shouldShowOnboarding: false
      })
    }
  }

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  // Show onboarding if user needs it
  if (onboardingStatus?.shouldShowOnboarding && session?.user?.id) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      </div>
    )
  }

  // Show main dashboard
  return <>{children}</>
}
