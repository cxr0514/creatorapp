import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function createTestData() {
  console.log('Starting test data creation...')
  
  try {
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
      console.log(`Created test user with ID: ${user.id}`)
    } else {
      console.log(`Found existing test user with ID: ${user.id}`)
    }
    
    // Check existing videos
    const existingVideos = await prisma.video.findMany({
      where: { userId: user.id }
    })
    
    console.log(`Found ${existingVideos.length} existing videos for user`)
    
    if (existingVideos.length === 0) {
      console.log('Creating test video...')
      const testVideo = await prisma.video.create({
        data: {
          title: 'Test Video for Clip Creation',
          storageUrl: 'https://f005.backblazeb2.com/file/test-bucket/videos/test/sample-video.mp4',
          storageKey: `videos/${user.id}/sample-video.mp4`,
          fileSize: 50000000, // 50MB
          duration: 120, // 2 minutes
          userId: user.id,
          uploadedAt: new Date()
        }
      })
      console.log(`Created test video with ID: ${testVideo.id}`)
    }
    
    // Show current state
    const allVideos = await prisma.video.findMany({
      where: { userId: user.id }
    })
    
    console.log('\n=== Current Videos ===')
    allVideos.forEach(video => {
      console.log(`ID: ${video.id}, Title: ${video.title}`)
      console.log(`  Storage Key: ${video.storageKey}`)
      console.log(`  Duration: ${video.duration}s`)
      console.log(`  File Size: ${video.fileSize} bytes`)
    })
    

    
    console.log('\nTest data creation complete!')
    
  } catch (error) {
    console.error('Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
