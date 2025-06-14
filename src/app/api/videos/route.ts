import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { uploadToB2, syncUserVideosFromB2Enhanced, getPresignedUrl } from '@/lib/b2'

// Helper function to generate presigned URLs for thumbnails
async function generatePresignedThumbnailUrl(thumbnailUrl: string | null): Promise<string | null> {
  if (!thumbnailUrl) return null;
  
  try {
    // Check if this is a B2 URL that needs a presigned URL
    if (thumbnailUrl.includes('s3.us-east-005.backblazeb2.com') || thumbnailUrl.includes('CreatorStorage')) {
      // Extract the storage key from the URL
      const urlParts = thumbnailUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'CreatorStorage');
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const storageKey = urlParts.slice(bucketIndex + 1).join('/');
        console.log('[VIDEO-THUMBNAIL] Generating presigned URL for storage key:', storageKey);
        return await getPresignedUrl(storageKey, 3600); // 1 hour expiry
      }
    }
    
    // If it's not a B2 URL, return as-is (might be Cloudinary or other CDN)
    return thumbnailUrl;
  } catch (error) {
    console.error('[VIDEO-THUMBNAIL] Failed to generate presigned URL:', error);
    return null; // Return null if we can't generate presigned URL
  }
}

// Helper function to generate presigned URLs for video files
async function generatePresignedVideoUrl(video: { storageUrl: string | null, storageKey: string | null }): Promise<string | null> {
  if (!video.storageUrl) return null;
  
  try {
    // Check if this is a B2 URL that needs a presigned URL
    if (video.storageUrl.includes('s3.us-east-005.backblazeb2.com') || video.storageUrl.includes('Clipverse') || video.storageUrl.includes('CreatorStorage')) {
      // If we have a storage key, use it directly
      if (video.storageKey) {
        console.log('[VIDEO-URL] Generating presigned URL for storage key:', video.storageKey);
        return await getPresignedUrl(video.storageKey, 3600); // 1 hour expiry
      }
      
      // Otherwise, try to extract the storage key from the URL
      const urlParts = video.storageUrl.split('/');
      
      // Look for bucket name in URL and extract path after it
      let bucketIndex = urlParts.findIndex(part => part === 'Clipverse' || part === 'CreatorStorage');
      if (bucketIndex === -1) {
        // For direct B2 URLs like https://s3.us-east-005.backblazeb2.com/Clipverse/...
        bucketIndex = urlParts.findIndex(part => part === 'Clipverse' || part === 'CreatorStorage');
      }
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const storageKey = urlParts.slice(bucketIndex + 1).join('/');
        console.log('[VIDEO-URL] Extracted storage key from URL:', storageKey);
        return await getPresignedUrl(storageKey, 3600); // 1 hour expiry
      }
      
      console.warn('[VIDEO-URL] Could not extract storage key from B2 URL:', video.storageUrl);
      return null;
    }
    
    // If it's not a B2 URL, return as-is (might be external CDN)
    return video.storageUrl;
  } catch (error) {
    console.error('[VIDEO-URL] Failed to generate presigned URL:', error);
    return null; // Return null if we can't generate presigned URL
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For development/testing: Allow access even without session
    if (!session?.user?.email) {
      console.warn('No authenticated session found, returning mock videos for development testing')
      // Return mock data for testing modal functionality
      const mockVideos = [
        {
          id: 1,
          title: "Test Video for Modal Testing",
          url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
          duration: 30,
          createdAt: new Date().toISOString(),
          thumbnailUrl: null,
          storageKey: "test/sample-video.mp4",
          fileSize: 1000000
        },
        {
          id: 2,
          title: "Another Test Video",
          url: "https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4",
          duration: 45,
          createdAt: new Date().toISOString(),
          thumbnailUrl: null,
          storageKey: "test/sample-video-2.mp4",
          fileSize: 800000
        }
      ]
      return NextResponse.json(mockVideos)
    }

    const { searchParams } = new URL(request.url)
    const sync = searchParams.get('sync') === 'true'

    if (sync) {
      // Sync with B2 storage
      try {
        console.log('Syncing videos with B2...')
        
        // Get videos from B2 for this user
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })

        if (user) {
          const b2Videos = await syncUserVideosFromB2Enhanced(user.id)
          console.log(`Found ${b2Videos.length} videos in B2`)
          
          // Get existing videos from database
          const existingVideos = await prisma.video.findMany({
            where: { userId: user.id }
          })
          
          const existingKeys = new Set(existingVideos.map(v => v.storageKey))
          
          // Add missing videos to database
          for (const resource of b2Videos) {
            if (!existingKeys.has(resource.key)) {
              console.log(`Adding missing video: ${resource.key}`)
              
              // Extract filename from key (remove path prefix if any)
              const keyParts = resource.key.split('/')
              const filename = keyParts[keyParts.length - 1]
              const title = filename?.replace(/\.[^/.]+$/, '') || 'Untitled'
              
              await prisma.video.create({
                data: {
                  title,
                  storageUrl: resource.url,
                  storageKey: resource.key,
                  fileSize: resource.size || 0,
                  userId: user.id,
                  uploadedAt: resource.uploadedAt || new Date()
                }
              })
            }
          }
        }
      } catch (syncError) {
        console.error('Error syncing with B2:', syncError)
        // Continue with regular fetch even if sync fails
      }
    }

    const videos = await prisma.video.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    // Generate presigned URLs for video thumbnails and video files
    const formattedVideos = await Promise.all(videos.map(async video => {
      const presignedThumbnailUrl = await generatePresignedThumbnailUrl(video.thumbnailUrl);
      const presignedVideoUrl = await generatePresignedVideoUrl({ 
        storageUrl: video.storageUrl, 
        storageKey: video.storageKey 
      });
      
      return {
        id: video.id,
        title: video.title,
        filename: video.title, // Use title as filename since we store title based on filename
        url: presignedVideoUrl || video.storageUrl, // Use presigned URL if available, fallback to original
        publicId: video.storageKey,
        thumbnailUrl: presignedThumbnailUrl, // Use presigned URL
        duration: video.duration,
        createdAt: video.uploadedAt.toISOString()
      };
    }));

    return NextResponse.json(formattedVideos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Video upload - Session check:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (session?.user as any)?.id 
    })
    
    // Require authentication for video uploads
    if (!session?.user?.email) {
      console.warn('Upload attempt without authentication - returning 401')
      return NextResponse.json({ 
        error: 'Authentication required. Please log in to upload videos.' 
      }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Debug file information
    console.log('File upload debug:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type - check both MIME type and file extension
    const isVideoMimeType = file.type.startsWith('video/')
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.flv']
    const hasVideoExtension = videoExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext.toLowerCase())
    )
    
    if (!isVideoMimeType && !hasVideoExtension) {
      console.error('File type validation failed:', {
        mimeType: file.type,
        fileName: file.name,
        hasVideoMimeType: isVideoMimeType,
        hasVideoExtension: hasVideoExtension
      })
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 })
    }
    
    console.log('File type validation passed:', {
      mimeType: file.type,
      fileName: file.name,
      hasVideoMimeType: isVideoMimeType,
      hasVideoExtension: hasVideoExtension
    })

    // Validate file size (max 500MB for better user experience)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 500MB' }, { status: 400 })
    }

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      // If user doesn't exist, create them (fallback)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          image: session.user.image,
          emailVerified: new Date(),
        }
      })
    }

    // Convert file to buffer for B2 upload
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    })
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    console.log('Buffer details:', {
      isBuffer: Buffer.isBuffer(buffer),
      length: buffer.length,
      type: typeof buffer
    })

    // Upload to Backblaze B2
    console.log('Uploading to B2 for user:', user.id)

    // Create proper storage key and use correct MIME type
    const fileName = file.name
    const title = fileName.replace(/\.[^/.]+$/, '') // Remove extension
    const storageKey = `videos/${user.id}/${Date.now()}-${fileName}`
    
    console.log('Upload parameters:', {
      storageKey,
      contentType: file.type,
      bufferLength: buffer.length
    })
    
    const uploadResult = await uploadToB2(buffer, storageKey, file.type)

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        title,
        storageUrl: uploadResult.storageUrl,
        storageKey: uploadResult.storageKey,
        fileSize: file.size,
        userId: user.id
      }
    })

    console.log('Video created in database:', video.id)

    return NextResponse.json({ 
      videoId: video.id,
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        title: video.title,
        url: video.storageUrl,
        thumbnailUrl: video.thumbnailUrl,
        fileSize: video.fileSize
      }
    })
  } catch (error) {
    console.error('Video upload error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload video'
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('socket hang up')) {
        errorMessage = 'Upload connection failed. Please check your internet connection and try again.'
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo ENOTFOUND')) {
        errorMessage = 'Cannot connect to upload service. Please check your internet connection.'
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Upload timed out. Please try with a smaller file or check your connection.'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Upload service is temporarily unavailable. Please try again later.'
      } else if (error.message.includes('Invalid file type provided to uploadToB2')) {
        errorMessage = 'Invalid file format. Please upload a valid video file.'
      } else if (error.message.includes('File size') || error.message.includes('too large')) {
        errorMessage = 'File is too large. Please upload a file smaller than 500MB.'
      } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        errorMessage = 'Authentication failed. Please log in and try again.'
      } else {
        errorMessage = error.message || errorMessage
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
