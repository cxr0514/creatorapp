import { getPresignedUrl } from './src/lib/b2.js';

async function testVideoLoading() {
  try {
    console.log('🎬 Testing End-to-End Video Loading Flow...\n');
    
    // Step 1: Test direct presigned URL generation
    const storageKey = 'videos/cmbka9ghb0000ihyprif38tr8/test_video.mp4';
    console.log('1. Testing presigned URL generation...');
    console.log('🔑 Storage Key:', storageKey);
    
    const presignedUrl = await getPresignedUrl(storageKey, 3600);
    console.log('✅ Presigned URL generated:', presignedUrl);
    
    // Step 2: Test URL accessibility
    console.log('\n2. Testing URL accessibility...');
    const response = await fetch(presignedUrl, { method: 'HEAD' });
    console.log('📊 Status:', response.status);
    console.log('📋 Content-Type:', response.headers.get('content-type'));
    console.log('📦 Content-Length:', response.headers.get('content-length'));
    
    if (response.ok) {
      console.log('✅ SUCCESS: Presigned URL is accessible!');
      
      // Step 3: Test if it's video content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('video/')) {
        console.log('✅ Confirmed: Content is video format');
        console.log('🎯 VideoJS should be able to load this URL successfully');
        
        // Step 4: Test range requests (important for video seeking)
        console.log('\n3. Testing range request support...');
        const rangeResponse = await fetch(presignedUrl, { 
          method: 'GET',
          headers: { 'Range': 'bytes=0-1023' }
        });
        console.log('📊 Range request status:', rangeResponse.status);
        
        if (rangeResponse.status === 206) {
          console.log('✅ Range requests supported (essential for video seeking)');
        } else {
          console.log('⚠️  Range requests not supported (may affect video seeking)');
        }
        
        console.log('\n🎉 SOLUTION VERIFICATION:');
        console.log('✅ B2 presigned URLs are working correctly');
        console.log('✅ Videos are accessible with authentication');
        console.log('✅ Content-Type is correct for video playback');
        console.log('✅ Ready for VideoJS integration');
        
        console.log('\n🔄 Next Steps:');
        console.log('1. Test in browser with authentication');
        console.log('2. Open CreateClipModal and verify video loads');
        console.log('3. Confirm no more MEDIA_ERR_SRC_NOT_SUPPORTED errors');
        
      } else {
        console.log('❌ Content is not video format:', contentType);
      }
    } else {
      console.log('❌ FAILED: Presigned URL not accessible');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testVideoLoading();
