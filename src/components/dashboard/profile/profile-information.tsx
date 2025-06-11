'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CameraIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/use-toast'

interface ProfileData {
  id: string
  name: string
  email: string
  image?: string
  createdAt: string
  socialAccountsCount: number
}

interface ProfileInformationProps {
  profileData: ProfileData
  onUpdate: (updates: Partial<ProfileData>) => Promise<boolean>
}

export function ProfileInformation({ profileData, onUpdate }: ProfileInformationProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(profileData.name)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (editedName.trim() === '') {
      toast.error("Name cannot be empty")
      return
    }

    setIsUpdating(true)
    const success = await onUpdate({ name: editedName.trim() })
    
    if (success) {
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } else {
      toast.error("Failed to update profile")
    }
    setIsUpdating(false)
  }

  const handleCancel = () => {
    setEditedName(profileData.name)
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture Section */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profileData.image} alt={profileData.name} />
              <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                {getInitials(profileData.name)}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
              disabled
            >
              <CameraIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{profileData.name}</h3>
            <Button variant="outline" size="sm" disabled>
              Change Picture
            </Button>
            <p className="text-xs text-muted-foreground">
              Profile picture changes coming soon
            </p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <div className="flex space-x-2">
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1"
                  placeholder="Enter your full name"
                />
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="px-3"
                >
                  <CheckIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="px-3"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Input
                  value={profileData.name}
                  disabled
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email changes require account verification
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Connected Accounts:</span>
              <div className="mt-1 font-semibold text-foreground">
                {profileData.socialAccountsCount} platforms
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Account Type:</span>
              <div className="mt-1 font-semibold text-foreground">
                Creator
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Status:</span>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
