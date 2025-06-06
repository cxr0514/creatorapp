import { uploadToB2 } from './src/lib/b2.js';
import { readFileSync } from 'fs';

async function uploadTestVideo() {
  try {
    console.log('📤 Uploading test video to B2...');
    
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
    console.error('❌ Upload failed:', error);
  }
}

uploadTestVideo();
