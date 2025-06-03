'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, AlertCircle } from '@/lib/icons'

interface VideoUploadProps {
  onUploadComplete?: () => void
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const { data: session, status } = useSession()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Debug session state
  console.log('VideoUpload - Session status:', status)
  console.log('VideoUpload - Session data:', session)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Check authentication before attempting upload
    if (status === 'loading') {
      setError('Please wait for authentication to complete')
      return
    }
    
    if (status === 'unauthenticated' || !session) {
      setError('Please log in to upload videos. You must be authenticated to upload files.')
      return
    }

    // Additional session validation
    if (!session.user?.email) {
      setError('Invalid session. Please log out and log back in.')
      return
    }

    console.log('Starting upload with session:', session.user?.email)

    setUploading(true)
    setError(null)
    setSuccess(false)
    setUploadProgress(0)

    let progressInterval: NodeJS.Timeout | null = null
    let timeoutId: NodeJS.Timeout | null = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate upload progress with longer intervals for larger files
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval)
            return 90
          }
          return prev + 10 // Slower progress for more realistic large file uploads
        })
      }, 1000) // 1 second intervals

      // Use longer timeout for large file uploads
      const controller = new AbortController()
      timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minute timeout

      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        credentials: 'include' // Include session cookies for authentication
      })

      if (timeoutId) clearTimeout(timeoutId)
      if (progressInterval) clearInterval(progressInterval)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to upload videos. You need to be authenticated to use this feature.')
        }
        
        // Try to parse error response, fallback to generic message
        let errorMessage = `Upload failed with status ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError)
          // If we can't parse the response, it might be a network issue
          if (response.status === 0 || response.status >= 500) {
            errorMessage = 'Upload connection failed. Please check your internet connection and try again.'
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      
      setSuccess(true)
      setUploadProgress(100)
      
      // Call callback after a brief delay
      setTimeout(() => {
        onUploadComplete?.()
        // Reset state after callback
        setTimeout(() => {
          setSuccess(false)
          setUploadProgress(0)
        }, 2000)
      }, 1000)

    } catch (err) {
      console.error('Upload error:', err)
      if (progressInterval) clearInterval(progressInterval)
      if (timeoutId) clearTimeout(timeoutId)
      
      let errorMessage = 'Upload failed'
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Upload timed out. Please try with a smaller file or check your connection.'
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else if (err.message.includes('Please log in to upload videos')) {
          errorMessage = err.message
        } else if (err.message.includes('Upload connection failed')) {
          errorMessage = err.message
        } else if (err.message.includes('Load failed') || err.message.includes('ERR_NETWORK')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete, session, status])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <div className="w-full">
      {/* Authentication Status */}
      {status === 'loading' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">Loading authentication...</p>
        </div>
      )}
      
      {status === 'unauthenticated' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm">Please log in to upload videos</p>
        </div>
      )}
      
      {status === 'authenticated' && session && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">Logged in as {session.user?.email}</p>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? 'border-purple-500 bg-purple-50 scale-105' : 'border-border'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400 hover:bg-purple-50/50'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${success ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-6">
          {success ? (
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          ) : error ? (
            <div className="bg-red-100 rounded-full p-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          ) : (
            <div className={`rounded-full p-4 transition-all duration-300 ${uploading ? 'bg-purple-100' : 'bg-gradient-to-br from-purple-100 to-purple-200'}`}>
              <Upload className={`w-12 h-12 transition-all duration-300 ${uploading ? 'text-purple-600 animate-pulse' : 'text-purple-600'}`} />
            </div>
          )}
          
          <div>
            {uploading ? (
              <div className="space-y-4">
                <p className="text-xl font-semibold text-purple-700">Uploading your video...</p>
                <div className="w-80 bg-muted rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground font-medium">{uploadProgress}% complete</p>
                <p className="text-xs text-muted-foreground">This may take a few minutes for large files</p>
              </div>
            ) : success ? (
              <div className="space-y-2">
                <p className="text-xl font-semibold text-green-700">Upload successful!</p>
                <p className="text-sm text-green-600">Your video is ready for clip creation</p>
              </div>
            ) : error ? (
              <div className="space-y-2">
                <p className="text-xl font-semibold text-red-700">Upload failed</p>
                <p className="text-sm text-red-600 max-w-md">{error}</p>
              </div>
            ) : isDragActive ? (
              <div className="space-y-2">
                <p className="text-xl font-semibold text-purple-700">Drop your video here!</p>
                <p className="text-sm text-purple-600">Release to start uploading</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-card-foreground">
                    Upload Your Video
                  </p>
                  <p className="text-muted-foreground">
                    Drag & drop a video file, or click to browse
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-muted-foreground font-medium mb-2">Supported formats:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['MP4', 'MOV', 'AVI', 'MKV', 'WebM'].map(format => (
                      <span key={format} className="px-2 py-1 bg-background rounded border text-xs font-medium text-foreground">
                        {format}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Maximum file size: 500MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => setError(null)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Upload className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
