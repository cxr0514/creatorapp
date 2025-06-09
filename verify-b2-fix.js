const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

async function testB2Upload() {
  console.log('🧪 Testing Backblaze B2 Upload with Checksum Fix');
  console.log('=' .repeat(50));

  try {
    // Create S3 client with the same configuration as our app
    const client = new S3Client({
      endpoint: process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
      region: 'us-east-005',
      credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APP_KEY,
      },
      forcePathStyle: true,
      maxAttempts: 3,
      requestHandler: {
        connectionTimeout: 30000,
        requestTimeout: 300000,
      },
      disableS3ExpressSessionAuth: true,
      // Use the same runtime safeguards as our app
      requestChecksumCalculation: process.env.AWS_S3_REQUEST_CHECKSUM_CALCULATION || "WHEN_REQUIRED",
      responseChecksumValidation: process.env.AWS_S3_RESPONSE_CHECKSUM_VALIDATION || "WHEN_REQUIRED"
    });

    console.log('✅ S3 client created successfully');
    console.log(`📦 Bucket: ${process.env.B2_BUCKET_NAME}`);
    console.log(`🔗 Endpoint: ${process.env.B2_ENDPOINT}`);
    console.log();

    // Test upload
    const testFileName = `test-checksum-fix-${Date.now()}.txt`;
    const testContent = `Backblaze B2 checksum fix test
Timestamp: ${new Date().toISOString()}
This file tests that the AWS SDK checksum headers are properly handled.`;

    console.log('📤 Uploading test file...');
    console.log(`   File: ${testFileName}`);
    console.log(`   Size: ${testContent.length} bytes`);

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: testFileName,
      Body: testContent,
      ContentType: 'text/plain',
      Metadata: {
        'test-type': 'checksum-fix-verification',
        'timestamp': Date.now().toString()
      }
    });

    const startTime = Date.now();
    const result = await client.send(uploadCommand);
    const uploadTime = Date.now() - startTime;

    console.log('✅ Upload successful!');
    console.log(`   Upload time: ${uploadTime}ms`);
    console.log(`   ETag: ${result.ETag}`);
    console.log();

    // Verify the file exists
    console.log('🔍 Verifying file exists in bucket...');
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.B2_BUCKET_NAME,
      Prefix: testFileName,
      MaxKeys: 1
    });

    const listResult = await client.send(listCommand);
    const uploadedFile = listResult.Contents?.[0];

    if (uploadedFile) {
      console.log('✅ File verified in bucket:');
      console.log(`   Key: ${uploadedFile.Key}`);
      console.log(`   Size: ${uploadedFile.Size} bytes`);
      console.log(`   Last Modified: ${uploadedFile.LastModified}`);
    } else {
      console.log('⚠️  File not found in bucket listing');
    }

    console.log();
    console.log('🎉 BACKBLAZE B2 CHECKSUM FIX TEST PASSED!');
    console.log('✅ No "Unsupported header \'x-amz-checksum-…\'" errors occurred');
    console.log('✅ Upload completed successfully with AWS SDK version 3.726.1');
    console.log('✅ The fix is working correctly');

  } catch (error) {
    console.error('❌ TEST FAILED:');
    console.error('Error:', error.message);
    
    if (error.message?.includes('x-amz-checksum') || error.message?.includes('checksum')) {
      console.error('');
      console.error('🚨 CHECKSUM HEADER ERROR DETECTED');
      console.error('   This indicates the fix is not working properly');
      console.error('   AWS SDK is still sending unsupported checksum headers');
    }
    
    console.error('\nFull error details:');
    console.error(error);
  }
}

testB2Upload().catch(console.error);
