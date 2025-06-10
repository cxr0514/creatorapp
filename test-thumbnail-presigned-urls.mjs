// Test script to check if presigned URLs are working for thumbnails
import { getPresignedUrl } from './src/lib/b2.ts';

async function testThumbnailPresignedUrls() {
  console.log('🔍 Testing thumbnail presigned URL generation...\n');
  
  // Test URLs from the database
  const testUrls = [
    'https://s3.us-east-005.backblazeb2.com/Clipverse/clips/cmbk2n1vt0000ih3l69j8jbpx/clip_1749227354188_10_0_30_thumbnail.jpg',
    'https://s3.us-east-005.backblazeb2.com/Clipverse/clips/cmbk2n1vt0000ih3l69j8jbpx/clip_1749227347638_10_0_30_thumbnail.jpg',
    'https://s3.us-east-005.backblazeb2.com/Clipverse/clips/cmbka9ghb0000ihyprif38tr8/clip_1749219249756_8_0_2_thumbnail.jpg'
  ];

  for (let i = 0; i < testUrls.length; i++) {
    const originalUrl = testUrls[i];
    console.log(`Test ${i + 1}:`);
    console.log(`Original URL: ${originalUrl}`);
    
    try {
      // Extract storage key
      const urlParts = originalUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'Clipverse');
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const storageKey = urlParts.slice(bucketIndex + 1).join('/');
        console.log(`Storage Key: ${storageKey}`);
        
        // Generate presigned URL
        console.log('🔄 Generating presigned URL...');
        const presignedUrl = await getPresignedUrl(storageKey, 3600);
        
        if (presignedUrl) {
          console.log('✅ Presigned URL generated successfully');
          console.log(`URL Length: ${presignedUrl.length} characters`);
          console.log(`Has signature: ${presignedUrl.includes('X-Amz-Signature')}`);
          console.log(`First 100 chars: ${presignedUrl.substring(0, 100)}...`);
        } else {
          console.log('❌ Failed to generate presigned URL (returned null)');
        }
      } else {
        console.log('❌ Could not extract storage key from URL');
      }
    } catch (error) {
      console.log('❌ Error generating presigned URL:', error.message);
    }
    
    console.log('---\n');
  }
}

// Test the helper function from the API
async function generatePresignedThumbnailUrl(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  
  try {
    // Check if this is a B2 URL that needs a presigned URL
    if (thumbnailUrl.includes('s3.us-east-005.backblazeb2.com') || thumbnailUrl.includes('Clipverse')) {
      // Extract the storage key from the URL
      const urlParts = thumbnailUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'Clipverse');
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const storageKey = urlParts.slice(bucketIndex + 1).join('/');
        console.log('[THUMBNAIL] Generating presigned URL for storage key:', storageKey);
        return await getPresignedUrl(storageKey, 3600); // 1 hour expiry
      }
    }
    
    // If it's not a B2 URL, return as-is (might be Cloudinary or other CDN)
    return thumbnailUrl;
  } catch (error) {
    console.error('[THUMBNAIL] Failed to generate presigned URL:', error);
    return null; // Return null if we can't generate presigned URL
  }
}

async function testApiHelperFunction() {
  console.log('🧪 Testing API helper function...\n');
  
  const testUrl = 'https://s3.us-east-005.backblazeb2.com/Clipverse/clips/cmbk2n1vt0000ih3l69j8jbpx/clip_1749227354188_10_0_30_thumbnail.jpg';
  
  try {
    const result = await generatePresignedThumbnailUrl(testUrl);
    console.log('✅ Helper function result:', !!result);
    if (result && result !== testUrl) {
      console.log('✅ Successfully generated different presigned URL');
    } else if (result === testUrl) {
      console.log('⚠️  Returned original URL (might not be B2 URL)');
    } else {
      console.log('❌ Returned null');
    }
  } catch (error) {
    console.log('❌ Helper function error:', error.message);
  }
}

// Run tests
async function runAllTests() {
  try {
    await testThumbnailPresignedUrls();
    await testApiHelperFunction();
    console.log('🏁 Testing complete!');
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

runAllTests();
