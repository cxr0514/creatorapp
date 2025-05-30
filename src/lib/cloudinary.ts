import { v2 as cloudinary } from 'cloudinary'

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
    transformation: [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'center',
        quality,
        start_offset: `${startOffset}s`
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

export { cloudinary }
