// Utility functions for onboarding detection and management

export interface UserOnboardingStatus {
  isCompleted: boolean
  currentStep: number | null
  shouldShowOnboarding: boolean
}

/**
 * Check if user needs onboarding based on their profile
 */
export async function checkUserOnboardingStatus(userId: string): Promise<UserOnboardingStatus> {
  try {
    const response = await fetch(`/api/users/${userId}/onboarding`)
    
    if (!response.ok) {
      // If no onboarding record exists, user needs onboarding
      if (response.status === 404) {
        return {
          isCompleted: false,
          currentStep: null,
          shouldShowOnboarding: true
        }
      }
      throw new Error('Failed to check onboarding status')
    }
    
    const { onboarding } = await response.json()
    
    // If no onboarding record exists, user needs onboarding
    if (!onboarding) {
      return {
        isCompleted: false,
        currentStep: null,
        shouldShowOnboarding: true
      }
    }
    
    return {
      isCompleted: onboarding.isCompleted || false,
      currentStep: onboarding.currentStep,
      shouldShowOnboarding: !onboarding.isCompleted
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // Default to showing onboarding if we can't determine status
    return {
      isCompleted: false,
      currentStep: null,
      shouldShowOnboarding: true
    }
  }
}

/**
 * Mark onboarding as completed for a user
 */
export async function completeUserOnboarding(userId: string, data?: unknown): Promise<void> {
  try {
    const response = await fetch(`/api/users/${userId}/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        onboardingData: data,
        preferences: data // The API expects both onboardingData and preferences
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to complete onboarding')
    }
  } catch (error) {
    console.error('Error completing onboarding:', error)
    throw error
  }
}

/**
 * Check if user has completed their profile setup
 */
export async function hasUserPreferences(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/users/${userId}/preferences`)
    return response.ok
  } catch (error) {
    console.error('Error checking user preferences:', error)
    return false
  }
}
