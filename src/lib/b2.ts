import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'

// B2 Configuration
const b2Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: 'us-west-002', // B2 region
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
  forcePathStyle: true, // Required for B2
})

const BUCKET_NAME = process.env.B2_BUCKET_NAME!

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
      storageUrl: `${process.env.B2_ENDPOINT}/${BUCKET_NAME}/${key}`
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

export { b2Client, BUCKET_NAME }
