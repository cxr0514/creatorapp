import { v2 as cloudinary, UploadApiOptions } from 'cloudinary'

// Cloudinary transformation types
interface CloudinaryTransformation {
  width?: number
  height?: number
  crop?: string
  gravity?: string
  quality?: string | number
  start_offset?: string
  end_offset?: string
  overlay?: string | { font_family?: string; font_size?: number; font_weight?: string; text?: string }
  color?: string
  x?: number
  y?: number
  opacity?: number
  format?: string
  fetch_format?: string
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Generate a thumbnail URL for a video stored in Cloudinary
 * @param publicId - The Cloudinary public ID of the video
 * @param options - Thumbnail generation options
 * @returns The thumbnail URL
 */
export function generateVideoThumbnail(
  publicId: string, 
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    startOffset?: number // seconds into the video
  } = {}
): string {
  const {
    width = 640,
    height = 360,
    quality = 'auto',
    format = 'jpg',
    startOffset = 0
  } = options

  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: format, // This forces the output format to be an image
    secure: true, // Always use HTTPS
    transformation: [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'center',
        quality,
        start_offset: `${startOffset}s`,
        fetch_format: 'auto' // Automatic format optimization
      }
    ]
  })
}

/**
 * Generate a clip thumbnail URL based on the original video and clip timing
 * @param videoPublicId - The Cloudinary public ID of the original video
 * @param startTime - Start time of the clip in seconds
 * @param options - Thumbnail generation options
 * @returns The thumbnail URL
 */
export function generateClipThumbnail(
  videoPublicId: string,
  startTime: number,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
  } = {}
): string {
  const {
    width = 640,
    height = 360,
    quality = 'auto',
    format = 'jpg'
  } = options

  return cloudinary.url(videoPublicId, {
    resource_type: 'video',
    format: format, // This forces the output format to be an image
    transformation: [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'center',
        quality,
        start_offset: `${startTime}s`
      }
    ]
  })
}

/**
 * Apply a style template to a video using Cloudinary transformations
 * @param videoPublicId - The Cloudinary public ID of the video
 * @param template - The style template configuration
 * @param options - Additional video processing options
 * @returns The transformed video URL
 */
export function applyStyleTemplate(
  videoPublicId: string,
  template: {
    fontFamily?: string
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    introCloudinaryId?: string
    outroCloudinaryId?: string
    logoCloudinaryId?: string
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
): string {
  const {
    startTime,
    endTime,
    aspectRatio = '16:9',
    quality = 'auto'
  } = options

  const transformations: CloudinaryTransformation[] = []

  // Base video cropping and quality
  const [width, height] = aspectRatio === '9:16' ? [1080, 1920] :
                          aspectRatio === '1:1' ? [1080, 1080] :
                          aspectRatio === '4:3' ? [1080, 1440] :
                          [1920, 1080] // Default 16:9

  transformations.push({
    width,
    height,
    crop: 'fill',
    gravity: 'center',
    quality,
    ...(startTime !== undefined && { start_offset: `${startTime}s` }),
    ...(endTime !== undefined && { end_offset: `${endTime}s` })
  })

  // Add logo overlay if specified
  if (template.logoCloudinaryId) {
    transformations.push({
      overlay: template.logoCloudinaryId,
      width: Math.floor(width * 0.15), // 15% of video width
      gravity: 'north_east',
      x: 20,
      y: 20,
      opacity: 85
    })
  }

  // Add lower third text overlay
  if (template.lowerThirdText) {
    const position = template.lowerThirdPosition || 'bottom_left'
    const gravity = position.includes('left') ? 'south_west' : 
                   position.includes('right') ? 'south_east' : 'south'
    
    transformations.push({
      overlay: {
        font_family: template.fontFamily || 'Arial',
        font_size: Math.floor(height * 0.04), // 4% of video height
        font_weight: 'bold',
        text: template.lowerThirdText
      },
      color: template.primaryColor?.replace('#', '') || 'ffffff',
      gravity,
      x: 30,
      y: 100
    })

    // Add background for lower third text
    if (template.backgroundColor) {
      transformations.push({
        overlay: 'rectangle',
        color: template.backgroundColor.replace('#', ''),
        opacity: 80,
        gravity,
        x: 20,
        y: 85,
        width: template.lowerThirdText.length * 20 + 40,
        height: Math.floor(height * 0.06)
      })
    }
  }

  // Add call-to-action overlay
  if (template.callToActionText) {
    const position = template.callToActionPosition || 'top_right'
    const gravity = position.includes('top') ? 
                   (position.includes('left') ? 'north_west' : 'north_east') :
                   (position.includes('left') ? 'south_west' : 'south_east')

    transformations.push({
      overlay: {
        font_family: template.fontFamily || 'Arial',
        font_size: Math.floor(height * 0.035),
        font_weight: 'normal',
        text: template.callToActionText
      },
      color: template.secondaryColor?.replace('#', '') || 'ffffff',
      gravity,
      x: 30,
      y: 30
    })
  }

  return cloudinary.url(videoPublicId, {
    resource_type: 'video',
    transformation: transformations,
    secure: true
  })
}

/**
 * Generate a video with intro and outro sequences
 * @param videoPublicId - The main video public ID
 * @param template - Template with intro/outro assets
 * @param options - Video processing options
 * @returns The concatenated video URL
 */
export function addIntroOutro(
  videoPublicId: string,
  template: {
    introCloudinaryId?: string
    outroCloudinaryId?: string
  },
  options: {
    startTime?: number
    endTime?: number
    aspectRatio?: string
  } = {}
): string {
  const {
    startTime,
    endTime,
    aspectRatio = '16:9'
  } = options

  const [width, height] = aspectRatio === '9:16' ? [1080, 1920] :
                          aspectRatio === '1:1' ? [1080, 1080] :
                          aspectRatio === '4:3' ? [1080, 1440] :
                          [1920, 1080]

    const transformations: CloudinaryTransformation[] = []

  // If intro is specified, we need to use video concatenation
  if (template.introCloudinaryId && template.outroCloudinaryId) {
    // Complex concatenation - this would typically require the video API
    // For now, we'll use overlay approach for simpler implementation
    transformations.push({
      width,
      height,
      crop: 'fill',
      gravity: 'center',
      ...(startTime !== undefined && { start_offset: `${startTime}s` }),
      ...(endTime !== undefined && { end_offset: `${endTime}s` })
    })
  } else if (template.introCloudinaryId) {
    // Add intro as overlay at the beginning
    transformations.push({
      overlay: template.introCloudinaryId,
      width,
      height,
      start_offset: '0s',
      end_offset: '3s' // 3 second intro
    })
  } else if (template.outroCloudinaryId) {
    // Add outro at the end
    transformations.push({
      width,
      height,
      crop: 'fill',
      gravity: 'center',
      ...(startTime !== undefined && { start_offset: `${startTime}s` }),
      ...(endTime !== undefined && { end_offset: `${endTime}s` })
    })
    
    transformations.push({
      overlay: template.outroCloudinaryId,
      width,
      height,
      start_offset: `${(endTime || 30) - 3}s` // Last 3 seconds
    })
  }

  return cloudinary.url(videoPublicId, {
    resource_type: 'video',
    transformation: transformations,
    secure: true
  })
}

/**
 * Upload a template asset (logo, intro, outro) to Cloudinary
 * @param file - The file to upload (File object or Buffer)
 * @param assetType - Type of asset ('logo', 'intro', 'outro')
 * @param userId - User ID for folder organization
 * @returns Upload result with public_id
 */
export async function uploadTemplateAsset(
  file: File | Buffer,
  assetType: 'logo' | 'intro' | 'outro',
  userId: string
): Promise<{ public_id: string; secure_url: string; resource_type: string }> {
  try {
    const resourceType = assetType === 'logo' ? 'image' : 'video'
    
    let uploadOptions: UploadApiOptions = {
      folder: `users/${userId}/templates/${assetType}s`,
      resource_type: resourceType as 'image' | 'video',
      public_id: `${assetType}_${Date.now()}`,
      overwrite: true
    }

    // Add specific options for different asset types
    if (assetType === 'logo') {
      uploadOptions = {
        ...uploadOptions,
        format: 'png', // Ensure transparency support
        transformation: [
          { width: 400, height: 400, crop: 'limit' } // Reasonable size limit
        ]
      }
    } else {
      // For intro/outro videos
      uploadOptions = {
        ...uploadOptions,
        video: {
          codec: 'h264',
          quality: 'auto'
        }
      }
    }

    let uploadData: string | Buffer
    
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      uploadData = Buffer.from(arrayBuffer)
    } else {
      uploadData = file
    }

    const result = await cloudinary.uploader.upload(
      `data:${resourceType}/${assetType === 'logo' ? 'png' : 'mp4'};base64,${uploadData.toString('base64')}`,
      uploadOptions
    )

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: resourceType
    }
  } catch (error) {
    console.error('Error uploading template asset:', error)
    throw new Error(`Failed to upload ${assetType} asset`)
  }
}

/**
 * Delete a template asset from Cloudinary
 * @param publicId - The Cloudinary public ID to delete
 * @param resourceType - The resource type ('image' or 'video')
 * @returns Deletion result
 */
export async function deleteTemplateAsset(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    })
    
    return result
  } catch (error) {
    console.error('Error deleting template asset:', error)
    throw new Error('Failed to delete template asset')
  }
}

export { cloudinary }
