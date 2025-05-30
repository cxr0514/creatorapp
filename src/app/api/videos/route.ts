import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        createdAt: 'desc'
      }
    })

    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      url: video.url,
      publicId: video.publicId,
      duration: video.duration,
      createdAt: video.createdAt.toISOString(),
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

    // Upload to Cloudinary with optimized settings for large files
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'creator_uploads/videos',
          eager: [
            { width: 300, height: 200, crop: 'scale', format: 'jpg' } // Generate thumbnail asynchronously
          ],
          eager_async: true,
          chunk_size: 6000000, // 6MB chunks for large files
          timeout: 300000, // 5 minute timeout for large files
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

    const cloudinaryResult = uploadResult as any

    // Create video record in database
    const fileName = file.name
    const title = fileName.replace(/\.[^/.]+$/, '') // Remove extension
    
    const video = await prisma.video.create({
      data: {
        title,
        description: `Uploaded video: ${fileName}`,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        duration: cloudinaryResult.duration || 0, // May be 0 for async processing
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
        url: video.url,
        duration: video.duration,
        isProcessing: !cloudinaryResult.duration // Indicate if still processing
      }
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}
