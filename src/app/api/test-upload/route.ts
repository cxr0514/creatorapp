import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { uploadToB2 } from '@/lib/b2'
import path from 'path'

export async function POST() {
  try {
    console.log('📤 Starting test video upload to B2...')
    
    // Read the test video file
    const videoPath = path.join(process.cwd(), 'test_video.mp4')
    console.log('📹 Reading video file:', videoPath)
    
    const videoBuffer = readFileSync(videoPath)
    console.log('✅ Video file loaded:', videoBuffer.length, 'bytes')
    
    // Upload to B2 with the exact storage key our database expects
    const storageKey = 'videos/cmbka9ghb0000ihyprif38tr8/test_video.mp4'
    console.log('🔑 Uploading to storage key:', storageKey)
    
    const result = await uploadToB2(videoBuffer, storageKey, 'video/mp4')
    console.log('✅ Upload successful!')
    console.log('🔗 Result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Test video uploaded successfully!',
      storageUrl: result.storageUrl,
      storageKey: result.storageKey
    })
    
  } catch (error) {
    console.error('❌ Upload failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to upload test video'
    }, { status: 500 })
  }
}
