#!/usr/bin/env node
import { uploadToB2 } from './src/lib/b2.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    console.log('🚀 Starting B2 video upload...');
    
    // Read the test video file
    const videoPath = join(__dirname, 'test_clip_video.mp4');
    console.log('📹 Reading video file:', videoPath);
    
    const videoBuffer = readFileSync(videoPath);
    console.log('✅ Video file loaded:', videoBuffer.length, 'bytes');
    
    // Use the exact storage key that our test video expects
    const storageKey = 'videos/cmbka9ghb0000ihyprif38tr8/test_clip_video.mp4';
    console.log('🔑 Uploading to storage key:', storageKey);
    
    const result = await uploadToB2(videoBuffer, storageKey, 'video/mp4');
    console.log('✅ Upload successful!');
    console.log('🔗 Storage URL:', result.storageUrl);
    console.log('📂 Storage Key:', result.storageKey);
    
    console.log('\n🎉 Test video uploaded successfully!');
    console.log('📝 You can now test clip creation with:');
    console.log('curl -X POST http://localhost:3002/api/clips -H "Content-Type: application/json" -d \'{"videoId": 6, "startTime": 5, "endTime": 15}\'');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('💥 Full error:', error);
    process.exit(1);
  }
}

main();
