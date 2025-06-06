// Upload test video to B2 storage
console.log('🚀 Starting upload script...');

import { uploadToB2 } from './src/lib/b2.js';
import { readFileSync } from 'fs';

async function uploadTestVideo() {
  try {
    console.log('📤 Uploading test video to B2...');
    
    // Check if environment variables are loaded
    console.log('Environment check - B2_BUCKET_NAME:', process.env.B2_BUCKET_NAME ? 'SET' : 'NOT SET');
    console.log('Environment check - B2_KEY_ID:', process.env.B2_KEY_ID ? 'SET' : 'NOT SET');
    
    // Read the test video file
    const videoBuffer = readFileSync('test_clip_video.mp4');
    console.log('📹 Video file size:', videoBuffer.length, 'bytes');
    
    // Upload with the exact storage key that the database expects
    const storageKey = 'videos/cmbka9ghb0000ihyprif38tr8/test_clip_video.mp4';
    console.log('🔑 Storage key:', storageKey);
    
    const result = await uploadToB2(videoBuffer, storageKey, 'video/mp4');
    console.log('✅ Upload successful!');
    console.log('🔗 Storage URL:', result.storageUrl);
    console.log('📂 Storage Key:', result.storageKey);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('Full error:', error);
  }
}

uploadTestVideo().then(() => {
  console.log('✨ Script execution completed');
}).catch(error => {
  console.error('💥 Script execution failed:', error);
});
