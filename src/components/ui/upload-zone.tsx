'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/use-toast'
import { debugLogger } from '@/lib/debug-logger'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { useSession } from 'next-auth/react'

// Types
interface FileUploadState {
  id: string
  file: File
  status: 'validating' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error'
  progress: number
  error?: string
  startTime: number
  estimatedTimeRemaining?: number
  speed?: number
}

interface UploadZoneProps {
  onUploadComplete?: (fileId: string, fileUrl: string) => void
  onUploadProgress?: (fileId: string, progress: number) => void
  onUploadError?: (fileId: string, error: string) => void
  acceptedFileTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  className?: string
  disabled?: boolean
}

// Constants
const DEFAULT_ACCEPTED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo'
]

const DEFAULT_MAX_SIZE = 500 * 1024 * 1024 // 500MB
const DEFAULT_MAX_FILES = 5

const UPLOAD_STAGES = {
  validating: { label: 'Validating file...', color: 'bg-blue-500' },
  uploading: { label: 'Uploading...', color: 'bg-blue-500' },
  processing: { label: 'Processing video...', color: 'bg-purple-500' },
  analyzing: { label: 'Analyzing content...', color: 'bg-green-500' },
  complete: { label: 'Upload complete!', color: 'bg-green-500' },
  error: { label: 'Upload failed', color: 'bg-red-500' }
} as const

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

export function UploadZone({
  onUploadComplete,
  onUploadProgress,
  onUploadError,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  className,
  disabled = false
}: UploadZoneProps) {
  const [uploadStates, setUploadStates] = useState<Record<string, FileUploadState>>({})
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  // Utility functions
  const generateFileId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const updateFileState = useCallback((fileId: string, updates: Partial<FileUploadState>) => {
    setUploadStates(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], ...updates }
    }))

    // Report progress to parent
    if (updates.progress !== undefined) {
      onUploadProgress?.(fileId, updates.progress)
    }
  }, [onUploadProgress])

  // Validation functions
  const validateFileType = useCallback((file: File): boolean => {
    return acceptedFileTypes.some(type => file.type === type)
  }, [acceptedFileTypes])

  const validateFileSize = useCallback((file: File): boolean => {
    return file.size <= maxFileSize
  }, [maxFileSize])

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (!validateFileType(file)) {
      return {
        isValid: false,
        error: `File type not supported. Please use: ${acceptedFileTypes.join(', ')}`
      }
    }

    if (!validateFileSize(file)) {
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${formatFileSize(maxFileSize)}`
      }
    }

    return { isValid: true }
  }, [acceptedFileTypes, maxFileSize, validateFileType, validateFileSize])

  // Upload function using direct API call
  const uploadFile = useCallback(async (fileId: string, file: File) => {
    debugLogger.info('UploadZone', `Starting upload for file: ${fileId}`)
    updateFileState(fileId, { status: 'uploading' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }

      const result = await response.json()
      debugLogger.info('UploadZone', `Upload successful for file: ${fileId}`, result)
      
      updateFileState(fileId, { status: 'complete', progress: 100 })
      onUploadComplete?.(fileId, result.video?.url || result.storageUrl)
      
      toast({
        title: 'Upload Complete',
        description: 'Your video has been successfully uploaded and processed.',
      })
    } catch (error) {
      debugLogger.error('UploadZone', `Upload failed for file: ${fileId}`, 
        error instanceof Error ? error.message : String(error))
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      updateFileState(fileId, { 
        status: 'error', 
        error: errorMessage
      })
      onUploadError?.(fileId, errorMessage)
      
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [updateFileState, onUploadComplete, onUploadError, toast])

  const simulateProgress = useCallback((fileId: string) => {
    const state = uploadStates[fileId]
    if (!state || state.status === 'complete' || state.status === 'error') return

    let currentProgress = state.progress
    const elapsedTime = (Date.now() - state.startTime) / 1000
    
    // Calculate progress based on stage
    switch (state.status) {
      case 'validating':
        currentProgress = Math.min(15, elapsedTime * 30)
        if (currentProgress >= 15) {
          updateFileState(fileId, { status: 'uploading', progress: 15 })
        }
        break
      case 'uploading':
        currentProgress = Math.min(70, 15 + (elapsedTime - 0.5) * 20)
        if (currentProgress >= 70) {
          updateFileState(fileId, { status: 'processing', progress: 70 })
        }
        break
      case 'processing':
        currentProgress = Math.min(90, 70 + (elapsedTime - 3) * 15)
        if (currentProgress >= 90) {
          updateFileState(fileId, { status: 'analyzing', progress: 90 })
        }
        break
      case 'analyzing':
        currentProgress = Math.min(98, 90 + (elapsedTime - 4.5) * 10)
        break
    }

    // Calculate speed and ETA
    const speed = currentProgress / elapsedTime
    const estimatedTimeRemaining = speed > 0 ? (100 - currentProgress) / speed : 0

    updateFileState(fileId, { 
      progress: currentProgress, 
      speed,
      estimatedTimeRemaining 
    })
  }, [uploadStates, updateFileState])

  // File handling
  const processFile = useCallback(async (file: File) => {
    const fileId = generateFileId()
    debugLogger.info('UploadZone', `Processing file: ${file.name}`, { fileId, size: file.size })

    // Initial file state
    const initialState: FileUploadState = {
      id: fileId,
      file,
      status: 'validating',
      progress: 0,
      startTime: Date.now()
    }

    setUploadStates(prev => ({ ...prev, [fileId]: initialState }))

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      debugLogger.error('UploadZone', `File validation failed: ${file.name}`, validation.error)
      updateFileState(fileId, { 
        status: 'error', 
        error: validation.error 
      })
      return
    }

    // Check authentication
    if (status !== 'authenticated' || !session?.user) {
      debugLogger.warn('UploadZone', 'User not authenticated for upload')
      updateFileState(fileId, { 
        status: 'error', 
        error: 'You must be logged in to upload videos' 
      })
      return
    }

    // Start upload process
    await uploadFile(fileId, file)
  }, [updateFileState, session, status, validateFile, uploadFile])

  const removeFile = (fileId: string) => {
    debugLogger.info('UploadZone', `Removing file: ${fileId}`)
    setUploadStates(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [fileId]: _, ...rest } = prev
      return rest
    })
  }

  // Dropzone configuration
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    debugLogger.info('UploadZone', `Files dropped`, { 
      accepted: acceptedFiles.length, 
      rejected: rejectedFiles.length 
    })

    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      debugLogger.warn('UploadZone', `File rejected: ${file.name}`, 
        errors.map(err => err.message).join(', '))
      toast({
        title: 'File Rejected',
        description: `${file.name}: ${errors[0]?.message || 'Invalid file'}`,
        variant: 'destructive',
      })
    })

    // Check file count limit
    const currentFileCount = Object.keys(uploadStates).length
    const newFileCount = acceptedFiles.length
    
    if (currentFileCount + newFileCount > maxFiles) {
      toast({
        title: 'Too Many Files',
        description: `You can only upload ${maxFiles} files at a time.`,
        variant: 'destructive',
      })
      return
    }

    // Process accepted files
    for (const file of acceptedFiles) {
      await processFile(file)
    }
  }, [uploadStates, maxFiles, toast, processFile])

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles,
    disabled: disabled || isCheckingAuth
  })

  // Progress simulation effect
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(uploadStates).forEach(fileId => {
        simulateProgress(fileId)
      })
    }, 500)

    return () => clearInterval(interval)
  }, [uploadStates, simulateProgress])

  // Check auth status effect
  useEffect(() => {
    if (session === undefined) {
      setIsCheckingAuth(true)
    } else {
      setIsCheckingAuth(false)
    }
  }, [session])

  const fileList = Object.values(uploadStates)
  const hasFiles = fileList.length > 0

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          dropzoneActive && 'border-primary bg-primary/10',
          disabled && 'cursor-not-allowed opacity-50',
          isCheckingAuth && 'cursor-wait'
        )}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <CloudArrowUpIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isCheckingAuth ? 'Checking authentication...' : 'Upload your videos'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isCheckingAuth 
                ? 'Please wait while we verify your login status' 
                : `Drag and drop your videos here, or click to browse`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: {acceptedFileTypes.join(', ')} • Max size: {formatFileSize(maxFileSize)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {hasFiles && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {fileList.map((fileState) => (
              <FileUploadCard
                key={fileState.id}
                fileState={fileState}
                onRemove={() => removeFile(fileState.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// File Upload Card Component
function FileUploadCard({ 
  fileState, 
  onRemove 
}: { 
  fileState: FileUploadState
  onRemove: () => void 
}) {
  const stage = UPLOAD_STAGES[fileState.status]
  const isComplete = fileState.status === 'complete'
  const hasError = fileState.status === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'rounded-lg border p-4 bg-card',
        hasError && 'border-red-200 bg-red-50',
        isComplete && 'border-green-200 bg-green-50'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {hasError ? (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            ) : isComplete ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            ) : (
              <DocumentIcon className="h-6 w-6 text-blue-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="font-medium truncate">{fileState.file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(fileState.file.size)}
              </p>
            </div>

            {!hasError && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn('font-medium', stage.color.replace('bg-', 'text-'))}>
                    {stage.label}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(fileState.progress)}%
                  </span>
                </div>
                
                <Progress 
                  value={fileState.progress} 
                  className="h-2"
                />

                {fileState.estimatedTimeRemaining && fileState.estimatedTimeRemaining > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ClockIcon className="h-3 w-3" />
                    <span>
                      {formatTime(fileState.estimatedTimeRemaining)} remaining
                    </span>
                  </div>
                )}
              </div>
            )}

            {hasError && (
              <p className="text-sm text-red-600">
                {fileState.error}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 hover:bg-muted rounded"
          type="button"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

export default UploadZone
