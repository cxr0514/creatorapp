import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('Creating test data...')
    
    // Create or find test user
    let user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    
    if (!user) {
      console.log('Creating test user...')
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: new Date()
        }
      })
      console.log('Created test user with ID:', user.id)
    } else {
      console.log('Found existing test user with ID:', user.id)
    }
    
    // Check existing videos
    const existingVideos = await prisma.video.findMany({
      where: { userId: user.id }
    })
    
    console.log('Found existing videos:', existingVideos.length)
    
    let testVideo = null
    if (existingVideos.length === 0) {
      console.log('Creating test video...')
      testVideo = await prisma.video.create({
        data: {
          title: 'Test Video for Content Creation',
          storageUrl: 'https://f005.backblazeb2.com/file/test-bucket/videos/test/sample-video.mp4',
          storageKey: 'videos/' + user.id + '/sample-video.mp4',
          fileSize: 50000000,
          duration: 120,
          userId: user.id,
          uploadedAt: new Date()
        }
      })
      console.log('Created test video with ID:', testVideo.id)
    } else {
      testVideo = existingVideos[0]
      console.log('Using existing video with ID:', testVideo.id)
    }
    
    // Get all current data
    const allVideos = await prisma.video.findMany({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      videos: allVideos,
      message: 'Test data created successfully'
    })
    
  } catch (error) {
    console.error('Error creating test data:', error)
    return NextResponse.json(
      { error: 'Failed to create test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}