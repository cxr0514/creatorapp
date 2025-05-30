#!/usr/bin/env node

/**
 * Debug Thumbnail Generation
 * Tests if thumbnail URLs are being generated and if they're accessible
 */

const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: '.env.local' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function debugThumbnails() {
  console.log('🐛 Debug Thumbnail Generation');
  console.log('================================');
  
  // Check environment variables
  console.log('\n📝 Environment Check:');
  const requiredEnvs = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  let envOk = true;
  
  for (const env of requiredEnvs) {
    if (process.env[env]) {
      console.log(`✅ ${env}: Set (${process.env[env].substring(0, 10)}...)`);
    } else {
      console.log(`❌ ${env}: Missing`);
      envOk = false;
    }
  }
  
  if (!envOk) {
    console.log('\n❌ Missing Cloudinary credentials. Please check .env.local file.');
    return;
  }
  
  // Test Cloudinary connection
  console.log('\n🔗 Testing Cloudinary Connection:');
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
  } catch (error) {
    console.log('❌ Cloudinary connection failed:', error.message);
    return;
  }
  
  // Test thumbnail URL generation (without actual video)
  console.log('\n🎬 Testing Thumbnail URL Generation:');
  const testPublicId = 'test_video_id';
  
  // Generate video thumbnail URL
  const videoThumbnailUrl = cloudinary.url(testPublicId, {
    resource_type: 'video',
    transformation: [
      { width: 640, height: 360, crop: 'fill', gravity: 'center' },
      { quality: 'auto', format: 'jpg' },
      { start_offset: '0s' }
    ]
  });
  
  console.log('📹 Video thumbnail URL:', videoThumbnailUrl);
  
  // Generate clip thumbnail URL
  const clipThumbnailUrl = cloudinary.url(testPublicId, {
    resource_type: 'video',
    transformation: [
      { width: 640, height: 360, crop: 'fill', gravity: 'center' },
      { quality: 'auto', format: 'jpg' },
      { start_offset: '5s' }
    ]
  });
  
  console.log('✂️  Clip thumbnail URL:', clipThumbnailUrl);
  
  // Check if there are any videos in Cloudinary (with timeout and folder search)
  console.log('\n📂 Checking Cloudinary Videos:');
  try {
    // First, check root level videos
    console.log('  Checking root level...');
    const rootResources = await Promise.race([
      cloudinary.api.resources({
        resource_type: 'video',
        max_results: 5
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    
    console.log(`  Root level: ${rootResources.resources.length} videos`);
    
    // Check creator_uploads folder structure
    console.log('  Checking creator_uploads folders...');
    const folderResources = await Promise.race([
      cloudinary.api.resources({
        resource_type: 'video',
        type: 'upload',
        prefix: 'creator_uploads/',
        max_results: 10
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    
    console.log(`  Creator uploads: ${folderResources.resources.length} videos`);
    
    // Combine all resources
    const allResources = [...rootResources.resources, ...folderResources.resources];
    
    if (allResources.length > 0) {
      console.log(`✅ Found ${allResources.length} total videos in Cloudinary:`);
      allResources.forEach((resource, index) => {
        console.log(`  ${index + 1}. ${resource.public_id} (${(resource.bytes / 1024 / 1024).toFixed(2)} MB)`);
        
        // Generate thumbnail for this actual video
        const actualThumbnail = cloudinary.url(resource.public_id, {
          resource_type: 'video',
          transformation: [
            { width: 640, height: 360, crop: 'fill', gravity: 'center' },
            { quality: 'auto', format: 'jpg' },
            { start_offset: '0s' }
          ]
        });
        console.log(`     Thumbnail: ${actualThumbnail}`);
      });
    } else {
      console.log('⚠️  No videos found in Cloudinary. Upload a video first.');
    }
  } catch (error) {
    if (error.message === 'Timeout') {
      console.log('⚠️  Cloudinary API timeout - this is normal for large video libraries');
    } else {
      console.log('❌ Error checking Cloudinary videos:', error.message);
    }
  }
  
  // Test thumbnail accessibility
  console.log('\n🌐 Testing Thumbnail Accessibility:');
  if (videoThumbnailUrl) {
    try {
      const response = await fetch(videoThumbnailUrl);
      console.log(`📹 Video thumbnail HTTP status: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        console.log('   ⚠️  This is expected if the video doesn\'t exist in Cloudinary');
      }
    } catch (error) {
      console.log('❌ Error fetching video thumbnail:', error.message);
    }
  }
}

// Run debug
debugThumbnails().catch(console.error);
