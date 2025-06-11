'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserIcon, LinkIcon } from '@heroicons/react/24/outline'
import { ProfileInformation } from '@/components/dashboard/profile/profile-information'
import { SocialMediaTab } from '@/components/dashboard/profile/social-media-tab'

interface ProfileData {
  id: string
  name: string
  email: string
  image?: string
  createdAt: string
  socialAccountsCount: number
}

export function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<ProfileData>) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const updatedData = await response.json()
        setProfileData(updatedData)
        return true
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
    return false
  }

  if (loading || !profileData) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and connected social media accounts
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Social Media
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileInformation 
            profileData={profileData}
            onUpdate={updateProfile}
          />
          
          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    User ID
                  </label>
                  <div className="p-3 bg-muted rounded-md text-sm font-mono">
                    {profileData.id}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Member Since
                  </label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <SocialMediaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
