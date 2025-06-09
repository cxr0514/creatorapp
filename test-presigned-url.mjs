#!/usr/bin/env node
import { getPresignedUrl } from './src/lib/b2.js';

async function testPresignedUrl() {
  try {
    console.log('🔗 Testing presigned URL generation...\n');
    
    // Test with our known video storage key
    const storageKey = 'videos/cmbka9ghb0000ihyprif38tr8/test_video.mp4';
    console.log('🔑 Storage Key:', storageKey);
    
    console.log('⏳ Generating presigned URL...');
    const presignedUrl = await getPresignedUrl(storageKey, 3600); // 1 hour expiry
    
    console.log('✅ Presigned URL generated successfully!');
    console.log('🔗 URL:', presignedUrl);
    
    // Test if the presigned URL works
    console.log('\n🧪 Testing presigned URL accessibility...');
    const response = await fetch(presignedUrl, { method: 'HEAD' });
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    if (response.ok) {
      console.log('\n🎉 SUCCESS: Presigned URL is working!');
      console.log('✅ VideoJS should be able to load this URL');
      
      // Check Content-Type for video
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('video/')) {
        console.log('✅ Content-Type is video:', contentType);
      } else {
        console.log('⚠️  Content-Type is not video:', contentType);
      }
      
    } else {
      console.log('❌ FAILED: Presigned URL returned error');
    }
    
  } catch (error) {
    console.error('❌ Error testing presigned URL:', error);
  }
}

testPresignedUrl();
