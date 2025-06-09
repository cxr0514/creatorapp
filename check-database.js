// Test script to check database records
const { PrismaClient } = require('./src/generated/prisma')

async function checkDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Connecting to database...')
    
    // Check videos
    const videos = await prisma.video.findMany({
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('\n=== VIDEOS IN DATABASE ===')
    if (videos.length === 0) {
      console.log('No videos found in database.')
    } else {
      videos.forEach(video => {
        console.log(`- ID: ${video.id}, Title: ${video.title}`)
        console.log(`  Duration: ${video.duration}s, User: ${video.user?.email}`)
        console.log(`  Storage Key: ${video.storageKey}`)
        console.log(`  Storage URL: ${video.storageUrl}`)
        console.log('---')
      })
    }
    

    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
