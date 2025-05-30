'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

interface VideoUploadProps {
  onUploadComplete?: (videoId: number) => void
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

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
        signal: controller.signal
      })

      if (timeoutId) clearTimeout(timeoutId)
      if (progressInterval) clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || `Upload failed with status ${response.status}`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      
      setSuccess(true)
      setUploadProgress(100)
      
      // Call callback after a brief delay
      setTimeout(() => {
        onUploadComplete?.(result.videoId)
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
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete])

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
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${success ? 'border-green-300 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {success ? (
            <CheckCircle className="w-12 h-12 text-green-500" />
          ) : error ? (
            <AlertCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Upload className={`w-12 h-12 ${uploading ? 'text-blue-500' : 'text-gray-400'}`} />
          )}
          
          <div>
            {uploading ? (
              <div>
                <p className="text-lg font-medium text-blue-600">Uploading...</p>
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">{uploadProgress}% complete</p>
              </div>
            ) : success ? (
              <p className="text-lg font-medium text-green-600">Upload successful!</p>
            ) : error ? (
              <div>
                <p className="text-lg font-medium text-red-600">Upload failed</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
              </div>
            ) : isDragActive ? (
              <p className="text-lg font-medium text-blue-600">Drop the video here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drag & drop a video file, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports MP4, MOV, AVI, MKV, WebM (max 500MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Button
          onClick={() => setError(null)}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          Try Again
        </Button>
      )}
    </div>
  )
}
