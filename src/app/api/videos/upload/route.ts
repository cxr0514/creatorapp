import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { uploadToB2 } from '@/lib/b2'

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

    // Convert file to buffer for B2 upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Backblaze B2
    const fileName = file.name
    const title = fileName.replace(/\.[^/.]+$/, '') // Remove extension
    const storageKey = `videos/${user.id}/${Date.now()}-${fileName}`
    
    const uploadResult = await uploadToB2(buffer, storageKey, file.type)
    
    const video = await prisma.video.create({
      data: {
        title,
        storageUrl: uploadResult.storageUrl,
        storageKey: uploadResult.storageKey,
        fileSize: file.size,
        userId: user.id
      }
    })

    return NextResponse.json({ 
      videoId: video.id,
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        title: video.title,
        url: video.storageUrl,
        fileSize: video.fileSize
      }
    })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
