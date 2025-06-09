// Debug script to test video loading issues in the redesigned create clip modal
const { PrismaClient } = require('@prisma/client')

async function debugVideoLoading() {
    const prisma = new PrismaClient()
    
    try {
        console.log('🔍 Debugging Video Loading Issues...\n')
        
        // 1. Check if videos exist in database
        const videos = await prisma.video.findMany({
            take: 5,
            select: {
                id: true,
                title: true,
                url: true,
                duration: true,
                thumbnailUrl: true,
                status: true
            }
        })
        
        console.log('📹 Found Videos in Database:')
        videos.forEach((video, index) => {
            console.log(`${index + 1}. ID: ${video.id}`)
            console.log(`   Title: ${video.title}`)
            console.log(`   URL: ${video.url}`)
            console.log(`   Duration: ${video.duration}`)
            console.log(`   Status: ${video.status}`)
            console.log(`   Thumbnail: ${video.thumbnailUrl || 'None'}`)
            console.log('---')
        })
        
        // 2. Test video URL accessibility
        if (videos.length > 0) {
            console.log('\n🌐 Testing Video URL Accessibility...')
            for (const video of videos.slice(0, 3)) {
                try {
                    const response = await fetch(video.url, { method: 'HEAD' })
                    console.log(`✅ ${video.title}: ${response.status} ${response.statusText}`)
                    console.log(`   Content-Type: ${response.headers.get('content-type')}`)
                    console.log(`   Content-Length: ${response.headers.get('content-length')}`)
                } catch (error) {
                    console.log(`❌ ${video.title}: ${error.message}`)
                }
            }
        }
        
        // 3. Check for API endpoint
        console.log('\n🔌 Testing AI Clip Copy Endpoint...')
        try {
            const testPayload = {
                videoTitle: 'Test Video',
                clipCount: 1,
                platform: 'tiktok',
                action: 'generate'
            }
            
            const response = await fetch('http://localhost:3001/api/ai/clip-copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload)
            })
            
            console.log(`AI Endpoint Status: ${response.status}`)
            if (response.ok) {
                const data = await response.json()
                console.log('AI Response:', data)
            } else {
                const error = await response.text()
                console.log('AI Error:', error)
            }
        } catch (error) {
            console.log(`❌ AI Endpoint Error: ${error.message}`)
        }
        
    } catch (error) {
        console.error('❌ Debug Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the debug
debugVideoLoading().catch(console.error)
