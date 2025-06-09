// Simple debug for video loading
const { PrismaClient } = require('@prisma/client')

async function checkVideos() {
    const prisma = new PrismaClient()
    
    try {
        const videos = await prisma.video.findMany({ take: 3 })
        console.log('Videos found:', videos.length)
        videos.forEach(v => console.log(`- ${v.title}: ${v.url}`))
    } catch (error) {
        console.error('Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

checkVideos()
