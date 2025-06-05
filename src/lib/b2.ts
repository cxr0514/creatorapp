import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { uploadVideoToMockStorage, deleteFromMockStorage, listMockStorageVideos } from './mock-storage'

// B2 Configuration
// Check multiple possible environment variable names for flexibility
const BUCKET_NAME = process.env.B2_BUCKET_NAME || process.env.B2_BUCKET || 'clipverse'
const B2_ENDPOINT = 'https://s3.us-east-005.backblazeb2.com'
const B2_KEY_ID = process.env.B2_KEY_ID || process.env.B2_ACCESS_KEY_ID || '005b6bd484783950000000001'
const B2_APP_KEY = process.env.B2_APP_KEY || process.env.B2_SECRET_ACCESS_KEY || 'K005wJjnrNFqY9RjzW7Ew6bURb6LoW0'

console.log(`[B2-CONFIG] Bucket: ${BUCKET_NAME}`)
console.log(`[B2-CONFIG] Endpoint: ${B2_ENDPOINT}`)
console.log(`[B2-CONFIG] Key ID: ${B2_KEY_ID ? B2_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`)
console.log(`[B2-CONFIG] App Key: ${B2_APP_KEY ? B2_APP_KEY.substring(0, 8) + '...' : 'NOT SET'}`)

// Check if we're using valid B2 credentials or should use mock storage
// Using mock storage if credentials are missing, empty, or are known placeholder values
const USE_MOCK_STORAGE = !B2_KEY_ID || 
                        !B2_APP_KEY ||
                        B2_KEY_ID === '005b6bd484783950000000001' || 
                        B2_APP_KEY === 'K005wJjnrNFqY9RjzW7Ew6bURb6LoW0' ||
                        B2_KEY_ID.trim() === '' ||
                        B2_APP_KEY.trim() === ''

if (USE_MOCK_STORAGE) {
  console.warn('⚠️  Using MOCK STORAGE for development. Set real B2 credentials in .env for production.')
}

// Handle SSL certificate issues in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

// Disable AWS SDK checksum features for Backblaze B2 compatibility
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1'

// Configure B2 client - compatible with Backblaze B2
const b2Client = new S3Client({
  endpoint: B2_ENDPOINT,
  region: 'us-east-005',
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY
  },
  forcePathStyle: true,
  maxAttempts: 3,
  requestHandler: {
    connectionTimeout: 30000,     // 30 seconds
    requestTimeout: 300000,      // 5 minutes
  }
})

// Custom upload function that bypasses AWS SDK checksum middleware with retry logic
async function uploadDirectToB2(
  file: Buffer,
  bucket: string,
  key: string,
  contentType: string
): Promise<any> {
  console.log(`[UPLOAD-DIRECT] Starting upload for ${key} (${file.length} bytes)`)
  
  const maxRetries = 3
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[UPLOAD-DIRECT] Attempt ${attempt}/${maxRetries} for ${key}`)
      
      // Get a presigned URL for PUT operation (fresh URL for each attempt)
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      })
      
      const presignedUrl = await getSignedUrl(b2Client, putCommand, { expiresIn: 3600 })
      console.log(`[UPLOAD-DIRECT] Generated presigned URL for ${key} (attempt ${attempt})`)
      
      // Create AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minute timeout
      
      try {
        // Use fetch to upload directly with the presigned URL (bypasses AWS middleware)
        const response = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': contentType,
            'Content-Length': file.length.toString(),
          },
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        console.log(`[UPLOAD-DIRECT] Upload response: ${response.status} ${response.statusText}`)
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error text available')
          throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`)
        }
        
        console.log(`[UPLOAD-DIRECT] Successfully uploaded ${key} on attempt ${attempt}`)
        return { $metadata: { httpStatusCode: response.status } }
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        
        // Check if it's a timeout or network error that we should retry
        if (attempt < maxRetries && (
          fetchError.name === 'AbortError' ||
          fetchError.cause?.code === 'UND_ERR_SOCKET' ||
          fetchError.cause?.code === 'EPIPE' ||
          fetchError.message.includes('fetch failed')
        )) {
          console.log(`[UPLOAD-DIRECT] Retryable error on attempt ${attempt} for ${key}:`, fetchError.message)
          lastError = fetchError
          
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          console.log(`[UPLOAD-DIRECT] Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw fetchError
      }
      
    } catch (error) {
      console.log(`[UPLOAD-DIRECT] Error on attempt ${attempt} for ${key}:`, error)
      lastError = error
      
      if (attempt === maxRetries) {
        break
      }
    }
  }
  
  console.log(`[UPLOAD-DIRECT] All ${maxRetries} attempts failed for ${key}`)
  throw lastError
}

/**
 * Upload a file to B2
 * @param file - File buffer or File object
 * @param key - Storage key/path for the file
 * @param contentType - MIME type of the file
 * @returns Upload result with storage URL
 */
export async function uploadToB2(
  file: Buffer | File,
  key: string,
  contentType: string
): Promise<{ storageKey: string; storageUrl: string }> {
  try {
    let fileBuffer: Buffer
    
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
    } else {
      fileBuffer = file
    }

    const result = await uploadDirectToB2(fileBuffer, BUCKET_NAME, key, contentType)
    
    return {
      storageKey: key,
      storageUrl: `${B2_ENDPOINT}/${BUCKET_NAME}/${key}`
    }
  } catch (error) {
    console.error('Error uploading to B2:', error)
    throw new Error('Failed to upload file to B2')
  }
}

/**
 * Generate a presigned URL for accessing content from B2
 * @param key - Storage key of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for file access
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(b2Client, command, { expiresIn })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error('Failed to generate presigned URL')
  }
}

/**
 * Delete a file from B2
 * @param key - Storage key of the file to delete
 * @returns Deletion result
 */
export async function deleteFromB2(key: string): Promise<{ success: boolean }> {
  try {
    console.log(`[DELETE-B2] Deleting file: ${key}`)
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await b2Client.send(command)
    console.log(`[DELETE-B2] Successfully deleted: ${key}`)
    return { success: true }
  } catch (error) {
    console.error(`[DELETE-B2] Error deleting ${key}:`, error)
    throw new Error('Failed to delete file from B2')
  }
}

/**
 * Check if a file exists in B2
 * @param key - Storage key of the file
 * @returns Boolean indicating if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await b2Client.send(command)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Generate a thumbnail URL for a video stored in B2
 * @param storageKey - The B2 storage key of the video
 * @param options - Thumbnail generation options
 * @returns The thumbnail URL (presigned URL for now, could be enhanced with processing)
 */
export async function generateVideoThumbnail(
  storageKey: string, 
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    startOffset?: number // seconds into the video
  } = {}
): Promise<string> {
  // For now, return a presigned URL to the video
  // In a full implementation, you might generate actual thumbnails
  // using a video processing service or FFmpeg
  try {
    return await getPresignedUrl(storageKey)
  } catch (error) {
    console.error('Error generating video thumbnail:', error)
    throw new Error('Failed to generate video thumbnail')
  }
}

/**
 * Generate a clip thumbnail URL based on the original video
 * @param videoStorageKey - The B2 storage key of the original video
 * @param startTime - Start time of the clip in seconds
 * @param options - Thumbnail generation options
 * @returns The thumbnail URL
 */
export async function generateClipThumbnail(
  videoStorageKey: string,
  startTime: number,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
  } = {}
): Promise<string> {
  // For now, return a presigned URL to the video
  // In a full implementation, you might generate actual thumbnails
  // at the specific timestamp using FFmpeg or similar
  try {
    return await getPresignedUrl(videoStorageKey)
  } catch (error) {
    console.error('Error generating clip thumbnail:', error)
    throw new Error('Failed to generate clip thumbnail')
  }
}

/**
 * Apply a style template to a video (simplified version)
 * @param videoStorageKey - The B2 storage key of the video
 * @param template - The style template configuration
 * @param options - Additional video processing options
 * @returns The video URL (for now, just returns presigned URL)
 */
export async function applyStyleTemplate(
  videoStorageKey: string,
  template: {
    fontFamily?: string
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    introStorageKey?: string
    outroStorageKey?: string
    logoStorageKey?: string
    lowerThirdText?: string
    lowerThirdPosition?: string
    callToActionText?: string
    callToActionUrl?: string
    callToActionPosition?: string
  },
  options: {
    startTime?: number
    endTime?: number
    aspectRatio?: string
    quality?: string | number
  } = {}
): Promise<string> {
  // For now, return a presigned URL to the video
  // In a full implementation, you would process the video with overlays
  // using FFmpeg or a video processing service
  try {
    return await getPresignedUrl(videoStorageKey)
  } catch (error) {
    console.error('Error applying style template:', error)
    throw new Error('Failed to apply style template')
  }
}

/**
 * Generate a video with intro and outro sequences (simplified)
 * @param videoStorageKey - The main video storage key
 * @param template - Template with intro/outro assets
 * @param options - Video processing options
 * @returns The video URL
 */
export async function addIntroOutro(
  videoStorageKey: string,
  template: {
    introStorageKey?: string
    outroStorageKey?: string
  },
  options: {
    startTime?: number
    endTime?: number
    aspectRatio?: string
  } = {}
): Promise<string> {
  // For now, return a presigned URL to the video
  // In a full implementation, you would concatenate videos using FFmpeg
  try {
    return await getPresignedUrl(videoStorageKey)
  } catch (error) {
    console.error('Error adding intro/outro:', error)
    throw new Error('Failed to add intro/outro')
  }
}

/**
 * Upload a template asset (logo, intro, outro) to B2
 * @param file - The file to upload (File object or Buffer)
 * @param assetType - Type of asset ('logo', 'intro', 'outro')
 * @param userId - User ID for folder organization
 * @returns Upload result with storage key
 */
export async function uploadTemplateAsset(
  file: File | Buffer,
  assetType: 'logo' | 'intro' | 'outro',
  userId: string
): Promise<{ storageKey: string; storageUrl: string; resourceType: string }> {
  try {
    const resourceType = assetType === 'logo' ? 'image' : 'video'
    const timestamp = Date.now()
    const fileExtension = assetType === 'logo' ? 'png' : 'mp4'
    const storageKey = `users/${userId}/templates/${assetType}s/${assetType}_${timestamp}.${fileExtension}`
    
    const contentType = assetType === 'logo' ? 'image/png' : 'video/mp4'
    
    const result = await uploadToB2(file, storageKey, contentType)
    
    return {
      storageKey: result.storageKey,
      storageUrl: result.storageUrl,
      resourceType
    }
  } catch (error) {
    console.error('Error uploading template asset:', error)
    throw new Error(`Failed to upload ${assetType} asset`)
  }
}

/**
 * Delete a template asset from B2
 * @param storageKey - The B2 storage key to delete
 * @returns Deletion result
 */
export async function deleteTemplateAsset(
  storageKey: string
): Promise<{ result: string }> {
  try {
    await deleteFromB2(storageKey)
    return { result: 'ok' }
  } catch (error) {
    console.error('Error deleting template asset:', error)
    throw new Error('Failed to delete template asset')
  }
}

/**
 * Generate a transformation for video processing
 * @param format - Export format configuration
 * @param aspectRatio - Target aspect ratio
 * @param croppingType - Cropping strategy
 * @returns Transformation parameters (for future video processing)
 */
export function generateVideoTransformation(
  format: {
    width: number
    height: number
    aspectRatio: string
    platform: string
  },
  croppingType: string = 'center'
): {
  width: number
  height: number
  aspectRatio: string
  crop: string
  gravity: string
} {
  return {
    width: format.width,
    height: format.height,
    aspectRatio: format.aspectRatio,
    crop: 'fill',
    gravity: croppingType === 'smart' ? 'auto' : 'center'
  }
}

/**
 * Upload a video file to B2 with optimized settings
 * @param file - Video file buffer
 * @param userId - User ID for folder organization
 * @param filename - Original filename
 * @returns Upload result with storage details
 */
export async function uploadVideoToB2(
  file: Buffer,
  userId: string,
  filename: string
): Promise<{ key: string; url: string; size: number }> {
  try {
    // Use mock storage if B2 credentials are invalid
    if (USE_MOCK_STORAGE) {
      console.log('Using mock storage for video upload')
      return await uploadVideoToMockStorage(file, userId, filename)
    }

    // Validate required parameters
    if (!BUCKET_NAME) {
      throw new Error('B2_BUCKET_NAME environment variable is not set')
    }
    if (!userId) {
      throw new Error('User ID is required for secure upload')
    }
    if (!filename) {
      throw new Error('Filename is required')
    }

    const timestamp = Date.now()
    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'mp4'
    
    // Create secure storage path with user separation
    const storageKey = `users/${userId}/videos/${timestamp}_${filename}`
    
    // Determine content type based on file extension
    let contentType = 'video/mp4' // default
    switch (fileExtension) {
      case 'mov':
        contentType = 'video/quicktime'
        break
      case 'avi':
        contentType = 'video/x-msvideo'
        break
      case 'webm':
        contentType = 'video/webm'
        break
      case 'mkv':
        contentType = 'video/x-matroska'
        break
      default:
        contentType = 'video/mp4'
    }

    const result = await uploadDirectToB2(file, BUCKET_NAME, storageKey, contentType)
    
    return {
      key: storageKey,
      url: `${B2_ENDPOINT}/${BUCKET_NAME}/${storageKey}`,
      size: file.length
    }
  } catch (error) {
    console.error('Error uploading video to B2:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bucketName: BUCKET_NAME,
      endpoint: B2_ENDPOINT
    })
    throw new Error('Failed to upload video to B2')
  }
}

/**
 * Sync and list user videos from B2 storage
 * @param userId - User ID to list videos for
 * @returns Array of video resources from B2
 */
export async function syncUserVideosFromB2(userId: string): Promise<Array<{
  key: string
  url: string
  filename?: string
  size?: number
  uploadedAt?: Date
}>> {
  try {
    // Use mock storage if B2 credentials are invalid
    if (USE_MOCK_STORAGE) {
      console.log('Using mock storage for video sync')
      return listMockStorageVideos(userId)
    }

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `users/${userId}/videos/`,
    })

    const result = await b2Client.send(command)
    const videos: Array<{
      key: string
      url: string
      filename?: string
      size?: number
      uploadedAt?: Date
    }> = []

    // Handle case where no videos exist yet (Contents could be undefined or empty)
    if (result.Contents && result.Contents.length > 0) {
      for (const object of result.Contents) {
        if (object.Key && object.Key !== `users/${userId}/videos/`) { // Skip folder entries
          const url = `${B2_ENDPOINT}/${BUCKET_NAME}/${object.Key}`
          const filename = object.Key.split('/').pop()
          
          videos.push({
            key: object.Key,
            url,
            filename,
            size: object.Size,
            uploadedAt: object.LastModified
          })
        }
      }
    }

    console.log(`Found ${videos.length} videos in B2 for user ${userId}`)
    return videos
  } catch (error) {
    console.error('Error syncing videos from B2:', error)
    // Don't throw error for sync operations - return empty array instead
    console.warn('Returning empty video list due to sync error')
    return []
  }
}

/**
 * Sync and list user clips from B2 storage
 * @param userId - User ID to list clips for
 * @returns Array of clip resources from B2
 */
export async function syncUserClipsFromB2(userId: string): Promise<Array<{
  key: string
  url: string
  filename?: string
  size?: number
  lastModified?: Date
}>> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `users/${userId}/clips/`,
    })

    const result = await b2Client.send(command)
    const clips: Array<{
      key: string
      url: string
      filename?: string
      size?: number
      lastModified?: Date
    }> = []

    // Handle case where no clips exist yet (Contents could be undefined or empty)
    if (result.Contents && result.Contents.length > 0) {
      for (const object of result.Contents) {
        if (object.Key && object.Key !== `users/${userId}/clips/`) { // Skip folder entries
          const url = `${B2_ENDPOINT}/${BUCKET_NAME}/${object.Key}`
          const filename = object.Key.split('/').pop()
          
          clips.push({
            key: object.Key,
            url,
            filename,
            size: object.Size,
            lastModified: object.LastModified
          })
        }
      }
    }

    console.log(`Found ${clips.length} clips in B2 for user ${userId}`)
    return clips
  } catch (error) {
    console.error('Error syncing clips from B2:', error)
    // Don't throw error for sync operations - return empty array instead
    console.warn('Returning empty clips list due to sync error')
    return []
  }
}

/**
 * Comprehensive bidirectional sync between B2 storage and database
 * @param userId - User ID to sync videos for
 * @param options - Sync options
 * @returns Sync results with statistics
 */
export async function syncUserVideosBidirectional(
  userId: string,
  options: {
    cleanupOrphans?: boolean // Remove videos from B2 that don't exist in database
    addMissing?: boolean     // Add videos from B2 that don't exist in database
  } = { cleanupOrphans: true, addMissing: true }
): Promise<{
  addedToDatabase: number
  removedFromB2: number
  errors: string[]
  totalB2Videos: number
  totalDbVideos: number
}> {
  const errors: string[] = []
  let addedToDatabase = 0
  let removedFromB2 = 0

  try {
    // Get videos from B2
    const b2Videos = await syncUserVideosFromB2(userId)
    console.log(`Found ${b2Videos.length} videos in B2 for user ${userId}`)

    // Get videos from database (would need prisma import, so this is a skeleton)
    // This will be called from the API route where prisma is available
    
    return {
      addedToDatabase,
      removedFromB2,
      errors,
      totalB2Videos: b2Videos.length,
      totalDbVideos: 0 // Will be filled by calling function
    }
  } catch (error) {
    console.error('Error in bidirectional sync:', error)
    errors.push(error instanceof Error ? error.message : 'Unknown sync error')
    
    return {
      addedToDatabase: 0,
      removedFromB2: 0,
      errors,
      totalB2Videos: 0,
      totalDbVideos: 0
    }
  }
}

/**
 * Delete a video from B2 storage and optionally from database
 * @param storageKey - The B2 storage key of the video
 * @param userId - User ID for security validation
 * @returns Deletion result
 */
export async function deleteVideoFromB2(
  storageKey: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use mock storage if B2 credentials are invalid
    if (USE_MOCK_STORAGE) {
      console.log('Using mock storage for video deletion')
      return await deleteFromMockStorage(storageKey)
    }

    // Validate that the storage key belongs to this user
    if (!storageKey.startsWith(`users/${userId}/videos/`)) {
      throw new Error('Unauthorized: Video does not belong to this user')
    }

    await deleteFromB2(storageKey)
    
    console.log(`Successfully deleted video ${storageKey} from B2`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting video from B2:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete video from B2'
    }
  }
}

/**
 * Upload a video clip to B2 with optimized settings
 * @param file - Clip file buffer
 * @param userId - User ID for folder organization
 * @param filename - Original filename for the clip
 * @param videoId - ID of the parent video
 * @param startTime - Start time of the clip in seconds
 * @param endTime - End time of the clip in seconds
 * @returns Upload result with storage details
 */
export async function uploadClipToB2(
  file: Buffer,
  userId: string,
  filename: string,
  videoId: number,
  startTime: number,
  endTime: number
): Promise<{ key: string; url: string; size: number }> {
  try {
    // Use mock storage if B2 credentials are invalid
    if (USE_MOCK_STORAGE) {
      console.log('Using mock storage for clip upload')
      // For mock storage, modify the path to include clips folder
      const timestamp = Date.now()
      const mockKey = `users/${userId}/clips/${timestamp}_${filename}`
      const mockResult = await uploadVideoToMockStorage(file, userId, filename)
      return {
        key: mockKey,
        url: mockResult.url,
        size: mockResult.size
      }
    }

    // Validate required parameters
    if (!BUCKET_NAME) {
      throw new Error('B2_BUCKET_NAME environment variable is not set')
    }
    if (!userId) {
      throw new Error('User ID is required for secure upload')
    }
    if (!filename) {
      throw new Error('Filename is required')
    }

    const timestamp = Date.now()
    const fileExtension = filename.split('.').pop()?.toLowerCase() || 'mp4'
    
    // Create secure storage path with user separation for clips
    // Format: users/{userId}/clips/{timestamp}_{videoId}_{startTime}_{endTime}_{filename}
    const clipFilename = `${videoId}_${Math.round(startTime)}s_${Math.round(endTime)}s_${filename}`
    const storageKey = `users/${userId}/clips/${timestamp}_${clipFilename}`
    
    // Determine content type based on file extension
    let contentType = 'video/mp4' // default
    switch (fileExtension) {
      case 'mov':
        contentType = 'video/quicktime'
        break
      case 'avi':
        contentType = 'video/x-msvideo'
        break
      case 'webm':
        contentType = 'video/webm'
        break
      case 'mkv':
        contentType = 'video/x-matroska'
        break
      default:
        contentType = 'video/mp4'
    }

    console.log(`Uploading clip to B2: ${storageKey}`)
    const result = await uploadDirectToB2(file, BUCKET_NAME, storageKey, contentType)
    
    return {
      key: storageKey,
      url: `${B2_ENDPOINT}/${BUCKET_NAME}/${storageKey}`,
      size: file.length
    }
  } catch (error) {
    console.error('Error uploading clip to B2:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bucketName: BUCKET_NAME,
      endpoint: B2_ENDPOINT
    })
    throw new Error('Failed to upload clip to B2')
  }
}

/**
 * Extract a video clip from a source video stored in B2
 * @param sourceVideoKey - Storage key of the source video in B2
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @returns Buffer containing the extracted video clip
 */
export async function extractVideoClip(
  sourceVideoKey: string,
  startTime: number,
  endTime: number
): Promise<Buffer> {
  try {
    // TODO: Implement actual video clip extraction
    // This would involve:
    // 1. Download the source video from B2
    // 2. Use FFmpeg to extract the specified time segment
    // 3. Return the processed video as a buffer
    
    console.log(`[EXTRACT-CLIP] Would extract clip from ${sourceVideoKey} (${startTime}s - ${endTime}s)`)
    
    // For now, throw an error to indicate this feature isn't implemented yet
    throw new Error('Video clip extraction not yet implemented. This requires FFmpeg integration.')
    
    // Example implementation outline:
    // const sourceVideoUrl = await getPresignedUrl(sourceVideoKey)
    // const clipBuffer = await processVideoWithFFmpeg(sourceVideoUrl, startTime, endTime)
    // return clipBuffer
  } catch (error) {
    console.error('Error extracting video clip:', error)
    throw new Error('Failed to extract video clip')
  }
}

/**
 * Process a complete clip creation workflow
 * @param videoStorageKey - Storage key of the source video
 * @param userId - User ID for folder organization
 * @param videoId - ID of the parent video
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @param title - Title for the clip
 * @returns Processed clip details
 */
export async function processAndUploadClip(
  videoStorageKey: string,
  userId: string,
  videoId: number,
  startTime: number,
  endTime: number,
  title: string
): Promise<{ key: string; url: string; size: number }> {
  try {
    // Extract the clip from the source video
    const clipBuffer = await extractVideoClip(videoStorageKey, startTime, endTime)
    
    // Generate filename for the clip
    const clipFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`
    
    // Upload the extracted clip to B2
    const uploadResult = await uploadClipToB2(
      clipBuffer,
      userId,
      clipFilename,
      videoId,
      startTime,
      endTime
    )
    
    console.log(`[PROCESS-CLIP] Successfully processed and uploaded clip: ${uploadResult.key}`)
    return uploadResult
  } catch (error) {
    console.error('Error processing and uploading clip:', error)
    throw new Error('Failed to process and upload clip')
  }
}

/**
 * Diagnostic function to list ALL files in the B2 bucket
 * This helps debug sync issues by showing what's actually stored
 * @returns Array of all objects in the bucket
 */
export async function listAllB2Objects(): Promise<Array<{
  key: string
  size?: number
  lastModified?: Date
}>> {
  try {
    console.log('[DIAGNOSTIC] Listing ALL objects in B2 bucket...')
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1000 // Limit to prevent overwhelming output
    })

    const result = await b2Client.send(command)
    const objects: Array<{
      key: string
      size?: number
      lastModified?: Date
    }> = []

    if (result.Contents && result.Contents.length > 0) {
      for (const object of result.Contents) {
        if (object.Key) {
          objects.push({
            key: object.Key,
            size: object.Size,
            lastModified: object.LastModified
          })
        }
      }
    }

    console.log(`[DIAGNOSTIC] Found ${objects.length} total objects in B2:`)
    objects.forEach((obj, index) => {
      console.log(`[DIAGNOSTIC] ${index + 1}. ${obj.key} (${obj.size} bytes, ${obj.lastModified})`)
    })

    return objects
  } catch (error) {
    console.error('[DIAGNOSTIC] Error listing B2 objects:', error)
    return []
  }
}

/**
 * Enhanced sync function with better debugging
 * @param userId - User ID to sync videos for
 * @returns Array of video objects found in B2
 */
export async function syncUserVideosFromB2Enhanced(userId: string): Promise<Array<{
  key: string
  url: string
  filename?: string
  size?: number
  uploadedAt?: Date
}>> {
  try {
    console.log(`[SYNC-ENHANCED] Starting enhanced sync for user: ${userId}`)
    
    // Use mock storage if B2 credentials are invalid
    if (USE_MOCK_STORAGE) {
      console.log('[SYNC-ENHANCED] Using mock storage for video sync')
      return listMockStorageVideos(userId)
    }

    // First, list all objects to see what's actually in the bucket
    const allObjects = await listAllB2Objects()

    // Look for objects that belong to this user in various possible paths
    const userVideos = allObjects.filter(obj => 
      obj.key.includes(userId) && 
      (obj.key.includes('.mp4') || obj.key.includes('.mov') || obj.key.includes('.avi') || obj.key.includes('.webm') || obj.key.includes('.mkv'))
    )

    console.log(`[SYNC-ENHANCED] Found ${userVideos.length} video files for user ${userId}:`)
    userVideos.forEach((video, index) => {
      console.log(`[SYNC-ENHANCED] ${index + 1}. ${video.key}`)
    })

    // Also try the standard path
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `users/${userId}/videos/`,
    })

    const result = await b2Client.send(command)
    console.log(`[SYNC-ENHANCED] Standard path query found ${result.Contents?.length || 0} objects`)

    // Convert found videos to the expected format
    const videos: Array<{
      key: string
      url: string
      filename?: string
      size?: number
      uploadedAt?: Date
    }> = []

    userVideos.forEach(obj => {
      const url = `${B2_ENDPOINT}/${BUCKET_NAME}/${obj.key}`
      const filename = obj.key.split('/').pop()
      
      videos.push({
        key: obj.key,
        url,
        filename,
        size: obj.size,
        uploadedAt: obj.lastModified
      })
    })

    console.log(`[SYNC-ENHANCED] Returning ${videos.length} videos for user ${userId}`)
    return videos
  } catch (error) {
    console.error('[SYNC-ENHANCED] Error in enhanced sync:', error)
    return []
  }
}

export { b2Client, BUCKET_NAME }
