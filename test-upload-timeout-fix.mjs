import { createB2Client, getB2Config, uploadToB2 } from './src/lib/b2.ts';

/**
 * Test script to verify that upload timeout improvements are working
 */

async function testUploadTimeoutFix() {
  console.log('🧪 Testing Upload Timeout Fix...\n');
  
  try {
    // Test 1: Verify B2 client configuration
    console.log('1. Testing B2 client configuration...');
    
    const config = getB2Config();
    console.log('✅ B2 Configuration loaded:');
    console.log(`   - Bucket: ${config.bucketName}`);
    console.log(`   - Endpoint: ${config.endpoint}`);
    console.log(`   - Has valid credentials: ${config.hasValidB2Credentials}`);
    
    if (!config.hasValidB2Credentials) {
      console.log('❌ B2 credentials not configured properly');
      return;
    }
    
    // Test 2: Check client creation with timeout settings
    console.log('\n2. Testing B2 client creation with timeout settings...');
    const client = createB2Client();
    
    // Access the client configuration
    const clientConfig = client.config;
    console.log('✅ B2 Client created with configuration:');
    console.log(`   - Max attempts: ${clientConfig.maxAttempts}`);
    console.log(`   - Connection timeout: ${clientConfig.requestHandler.connectionTimeout}ms`);
    console.log(`   - Request timeout: ${clientConfig.requestHandler.requestTimeout}ms`);
    
    // Verify timeout values are correct
    const expectedConnectionTimeout = 60000; // 60 seconds
    const expectedRequestTimeout = 600000;   // 10 minutes
    const expectedMaxAttempts = 5;
    
    const actualConnectionTimeout = clientConfig.requestHandler.connectionTimeout;
    const actualRequestTimeout = clientConfig.requestHandler.requestTimeout;
    const actualMaxAttempts = clientConfig.maxAttempts;
    
    if (actualConnectionTimeout === expectedConnectionTimeout) {
      console.log('✅ Connection timeout correctly set to 60 seconds');
    } else {
      console.log(`❌ Connection timeout incorrect: expected ${expectedConnectionTimeout}, got ${actualConnectionTimeout}`);
    }
    
    if (actualRequestTimeout === expectedRequestTimeout) {
      console.log('✅ Request timeout correctly set to 10 minutes');
    } else {
      console.log(`❌ Request timeout incorrect: expected ${expectedRequestTimeout}, got ${actualRequestTimeout}`);
    }
    
    if (actualMaxAttempts === expectedMaxAttempts) {
      console.log('✅ Max attempts correctly set to 5');
    } else {
      console.log(`❌ Max attempts incorrect: expected ${expectedMaxAttempts}, got ${actualMaxAttempts}`);
    }
    
    // Test 3: Create a small test file to verify upload functionality
    console.log('\n3. Testing upload functionality with small file...');
    
    const testContent = Buffer.from('This is a test video file content for timeout testing');
    const testKey = `test-uploads/timeout-test-${Date.now()}.txt`;
    
    try {
      const result = await uploadToB2(testContent, testKey, 'text/plain');
      console.log('✅ Small file upload successful:');
      console.log(`   - Storage Key: ${result.storageKey}`);
      console.log(`   - Storage URL: ${result.storageUrl}`);
    } catch (uploadError) {
      console.log('❌ Small file upload failed:', uploadError.message);
    }
    
    console.log('\n🎉 Upload timeout fix verification complete!');
    console.log('\nKey improvements implemented:');
    console.log('• Connection timeout increased to 60 seconds');
    console.log('• Request timeout increased to 10 minutes for large files');
    console.log('• Max retry attempts increased to 5');
    console.log('• Frontend timeout extended to 10 minutes to match backend');
    console.log('• Proper AbortController timeout handling in presigned URL uploads');
    console.log('• Enhanced error handling for timeout scenarios');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testUploadTimeoutFix().catch(console.error);
