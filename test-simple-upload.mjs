import { uploadToB2 } from './src/lib/b2.js';

async function testB2Upload() {
  try {
    console.log('Testing B2 upload with AWS SDK...');
    
    // Create a small test buffer
    const testContent = 'Hello B2 World! This is a test upload.';
    const testBuffer = Buffer.from(testContent, 'utf8');
    
    const testKey = `test-uploads/test-${Date.now()}.txt`;
    console.log('Uploading to key:', testKey);
    
    const result = await uploadToB2(testBuffer, testKey, 'text/plain');
    console.log('✅ Upload successful!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
  }
}

testB2Upload();
