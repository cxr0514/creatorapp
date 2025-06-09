'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, AlertCircle } from '@/lib/icons'
import { UploadZone } from '@/components/ui/upload-zone'

interface VideoUploadProps {
  onUploadComplete?: () => void
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Debug session state
  console.log('VideoUpload - Session status:', status)
  console.log('VideoUpload - Session data:', session)

  const handleUploadComplete = (fileId: string, fileUrl: string) => {
    console.log('Upload completed:', { fileId, fileUrl })
    setSuccess(true)
    setError(null)
    
    // Call the parent callback after a brief delay
    setTimeout(() => {
      onUploadComplete?.()
      // Reset success state after callback
      setTimeout(() => {
        setSuccess(false)
      }, 2000)
    }, 1000)
  }

  const handleUploadError = (fileId: string, error: string) => {
    console.error('Upload failed:', { fileId, error })
    setError(error)
    setSuccess(false)
  }

  const handleUploadProgress = (fileId: string, progress: number) => {
    console.log('Upload progress:', { fileId, progress })
  }

  return (
    <div className="w-full">
      {/* Authentication Status */}
      {status === 'loading' && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-primary text-sm">🔄 Loading authentication...</p>
        </div>
      )}
      
      {status === 'unauthenticated' && (
        <div className="mb-4 p-3 bg-accent-warning/10 border border-accent-warning/20 rounded-lg">
          <p className="text-accent-warning text-sm font-medium">🔒 Authentication Required</p>
          <p className="text-accent-warning text-xs mt-1">Please log in with Google to upload videos. Click the &quot;Sign In&quot; button at the top of the page.</p>
        </div>
      )}
      
      {status === 'authenticated' && session && (
        <div className="mb-4 p-3 bg-accent-success/10 border border-accent-success/20 rounded-lg">
          <p className="text-accent-success text-sm">✅ Logged in as {session.user?.email}</p>
        </div>
      )}

      {/* Enhanced Upload Zone */}
      <UploadZone
        onUploadComplete={handleUploadComplete}
        onUploadProgress={handleUploadProgress}
        onUploadError={handleUploadError}
        acceptedFileTypes={[
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime',
          'video/x-msvideo'
        ]}
        maxFileSize={500 * 1024 * 1024} // 500MB
        maxFiles={1}
        disabled={status === 'loading' || status === 'unauthenticated'}
        className="mb-4"
      />

      {/* Success/Error States */}
      {success && (
        <div className="mt-4 p-4 bg-accent-success/10 border border-accent-success/20 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-6 h-6 text-accent-success mr-2" />
            <p className="text-accent-success font-semibold">Upload Successful!</p>
          </div>
          <p className="text-accent-success text-sm">Your video is ready for processing</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-accent-danger/10 border border-accent-danger/20 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="w-6 h-6 text-accent-danger mr-2" />
            <p className="text-accent-danger font-semibold">Upload Failed</p>
          </div>
          <p className="text-accent-danger text-sm mb-4">{error}</p>
          <Button
            onClick={() => setError(null)}
            className="bg-gradient-to-r from-primary to-primary hover:from-primary-hover hover:to-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            <Upload className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
