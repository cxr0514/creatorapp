import { PrismaClient } from './src/generated/prisma/index.js';
import { getPresignedUrl, listAllB2Objects, getB2Config } from './src/lib/b2.js';

async function checkB2Storage() {
  console.log('🔍 Checking B2 storage configuration and video file...\n');
  
  // Check B2 configuration
  const b2Config = getB2Config();
  console.log('B2 Configuration:');
  console.log('- Bucket Name:', b2Config.bucketName);
  console.log('- Endpoint:', b2Config.endpoint);
  console.log('- Has Valid Credentials:', b2Config.hasValidB2Credentials);
  console.log('- Key ID:', b2Config.keyId ? `${b2Config.keyId.substring(0, 10)}...` : 'Not set');
  console.log();

  try {
    // List all B2 objects to see what's actually in storage
    console.log('📂 Listing all objects in B2 storage...');
    const objects = await listAllB2Objects();
    console.log(`Found ${objects.length} objects in B2 storage:`);
    
    objects.forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.key} (${obj.size} bytes)`);
    });
    console.log();

    // Check for our specific video file
    const targetKey = 'videos/cmbka9ghb0000ihyprif38tr8/test_clip_video.mp4';
    const videoExists = objects.some(obj => obj.key === targetKey);
    console.log(`🎬 Target video file (${targetKey}):`, videoExists ? '✅ EXISTS' : '❌ NOT FOUND');
    
    if (videoExists) {
      // Try to generate presigned URL
      console.log('\n🔗 Generating presigned URL...');
      const presignedUrl = await getPresignedUrl(targetKey);
      console.log('Presigned URL:', presignedUrl);
      
      // Test if the URL works
      console.log('\n🧪 Testing presigned URL...');
      const response = await fetch(presignedUrl, { method: 'HEAD' });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    } else {
      console.log('\n🔍 Looking for similar files...');
      const videoFiles = objects.filter(obj => obj.key.includes('video') || obj.key.includes('.mp4'));
      if (videoFiles.length > 0) {
        console.log('Found video-related files:');
        videoFiles.forEach(file => console.log(`- ${file.key}`));
      } else {
        console.log('No video files found in B2 storage.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking B2 storage:', error);
  }
}

checkB2Storage();
