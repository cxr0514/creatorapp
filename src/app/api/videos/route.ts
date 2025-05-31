import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { cloudinary, generateVideoThumbnail } from '@/lib/cloudinary'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sync = searchParams.get('sync') === 'true'

    if (sync) {
      // Sync with Cloudinary storage
      try {
        console.log('Syncing videos with Cloudinary...')
        
        // Get user folder path
        const userFolderPath = `creatorapp/users/${session.user.email}/videos`
        
        // Get videos from Cloudinary
        const cloudinaryResult = await cloudinary.search
          .expression(`folder:${userFolderPath}`)
          .with_field('context')
          .max_results(100)
          .execute()
        
        console.log(`Found ${cloudinaryResult.resources.length} videos in Cloudinary`)
        
        // Get existing videos from database
        const existingVideos = await prisma.video.findMany({
          where: {
            user: {
              email: session.user.email
            }
          }
        })
        
        const existingCloudinaryIds = new Set(existingVideos.map(v => v.cloudinaryId))
        
        // Add missing videos to database
        for (const resource of cloudinaryResult.resources) {
          if (!existingCloudinaryIds.has(resource.public_id)) {
            console.log(`Adding missing video: ${resource.public_id}`)
            
            // Generate thumbnail
            const thumbnailUrl = await generateVideoThumbnail(resource.public_id)
            
            await prisma.video.create({
              data: {
                title: resource.filename || resource.public_id.split('/').pop() || 'Untitled',
                cloudinaryUrl: resource.secure_url,
                cloudinaryId: resource.public_id,
                thumbnailUrl,
                duration: resource.duration || 0,
                fileSize: resource.bytes,
                user: {
                  connect: {
                    email: session.user.email
                  }
                }
              }
            })
          }
        }
      } catch (syncError) {
        console.error('Error syncing with Cloudinary:', syncError)
        // Continue with regular fetch even if sync fails
      }
    }

    const videos = await prisma.video.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        _count: {
          select: {
            clips: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      filename: video.title, // Use title as filename since we store title based on filename
      url: video.cloudinaryUrl,
      publicId: video.cloudinaryId,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      createdAt: video.uploadedAt.toISOString(),
      clipCount: video._count.clips
    }))

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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 })
    }

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

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary with user-specific folder structure
    const userFolder = `creator_uploads/videos/${user.id}`
    
    console.log('Uploading to Cloudinary folder:', userFolder)
    console.log('Cloudinary config:', {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
    })

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: userFolder,
          use_filename: true,
          unique_filename: true,
          chunk_size: 6000000, // 6MB chunks for large files
          timeout: 120000, // 2 minute timeout
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('Cloudinary upload success:', result?.public_id)
            resolve(result)
          }
        }
      )

      // Handle stream errors
      uploadStream.on('error', (error) => {
        console.error('Upload stream error:', error)
        reject(error)
      })
      
      uploadStream.end(buffer)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cloudinaryResult = uploadResult as any

    // Create video record in database
    const fileName = file.name
    const title = fileName.replace(/\.[^/.]+$/, '') // Remove extension
    
    // Generate thumbnail URL (with error handling)
    let thumbnailUrl = null
    try {
      thumbnailUrl = generateVideoThumbnail(cloudinaryResult.public_id, {
        width: 640,
        height: 360,
        quality: 'auto'
      })
      console.log('✅ Generated thumbnail URL:', thumbnailUrl)
    } catch (error) {
      console.warn('⚠️ Failed to generate thumbnail URL:', error)
      // Continue without thumbnail - the UI will show a fallback icon
    }
    
    const video = await prisma.video.create({
      data: {
        title,
        cloudinaryUrl: cloudinaryResult.secure_url,
        cloudinaryId: cloudinaryResult.public_id,
        thumbnailUrl,
        duration: Math.round(cloudinaryResult.duration) || null, // Round to integer if exists
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
        url: video.cloudinaryUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        isProcessing: !cloudinaryResult.duration // Indicate if still processing
      }
    })
  } catch (error) {
    console.error('Video upload error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload video'
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('socket hang up')) {
        errorMessage = 'Upload connection failed. Please check your internet connection and try again.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try with a smaller file.'
      } else if (error.message.includes('Invalid')) {
        errorMessage = 'Invalid file format. Please upload a valid video file.'
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
