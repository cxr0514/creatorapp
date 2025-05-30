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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 100MB' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'creator_uploads/videos',
          format: 'mp4'
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cloudinaryResult = uploadResult as any

    // Create video record in database
    const fileName = file.name
    const title = fileName.replace(/\.[^/.]+$/, '') // Remove extension
    
    const video = await prisma.video.create({
      data: {
        title,
        cloudinaryUrl: cloudinaryResult.secure_url,
        cloudinaryId: cloudinaryResult.public_id,
        duration: cloudinaryResult.duration || 0,
        userId: user.id
      }
    })

    return NextResponse.json({ 
      videoId: video.id,
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        title: video.title,
        url: video.cloudinaryUrl,
        duration: video.duration
      }
    })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
