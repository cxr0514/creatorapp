import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'
import { uploadVideoToMockStorage, deleteFromMockStorage, listMockStorageVideos } from './mock-storage'

// B2 Configuration
// Fallback to default values if environment variables are empty
const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'clipverse'
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-west-002.backblazeb2.com'
const B2_KEY_ID = process.env.B2_KEY_ID || '005b6bd484783950000000001'
const B2_APP_KEY = process.env.B2_APP_KEY || 'K005wJjnrNFqY9RjzW7Ew6bURb6LoW0'

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

const b2Client = new S3Client({
  endpoint: B2_ENDPOINT,
  region: 'us-west-002', // B2 region
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
  forcePathStyle: true, // Required for B2
})

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

    const upload = new Upload({
      client: b2Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      },
    })

    const result = await upload.done()
    
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
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await b2Client.send(command)
    return { success: true }
  } catch (error) {
    console.error('Error deleting from B2:', error)
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

    const upload = new Upload({
      client: b2Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: storageKey,
        Body: file,
        ContentType: contentType,
      },
    })

    const result = await upload.done()
    
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

    if (result.Contents) {
      for (const object of result.Contents) {
        if (object.Key) {
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

    return videos
  } catch (error) {
    console.error('Error syncing videos from B2:', error)
    throw new Error('Failed to sync videos from B2')
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

    if (result.Contents) {
      for (const object of result.Contents) {
        if (object.Key) {
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

    return clips
  } catch (error) {
    console.error('Error syncing clips from B2:', error)
    throw new Error('Failed to sync clips from B2')
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

export { b2Client, BUCKET_NAME }
