import { uploadToB2 } from '../../../../lib/b2';
import { NextResponse } from 'next/server';

export async function POST() {
  console.log('[TEST-B2-UPLOAD] Received test upload request');
  
  try {
    // Create a small test buffer
    const testData = Buffer.from('Hello, Backblaze B2! This is a test upload from API endpoint.', 'utf8');
    const key = `test-uploads/api-test-${Date.now()}.txt`;
    const contentType = 'text/plain';
    
    console.log('[TEST-B2-UPLOAD] Starting upload test...');
    console.log(`[TEST-B2-UPLOAD] Key: ${key}`);
    console.log(`[TEST-B2-UPLOAD] Content-Type: ${contentType}`);
    console.log(`[TEST-B2-UPLOAD] Data size: ${testData.length} bytes`);
    
    const result = await uploadToB2(testData, key, contentType);
    
    console.log('[TEST-B2-UPLOAD] Upload successful!');
    console.log(`[TEST-B2-UPLOAD] Result:`, result);
    
    return NextResponse.json({
      success: true,
      message: 'B2 upload test successful',
      result: result
    });
  } catch (error) {
    console.error('[TEST-B2-UPLOAD] Upload test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'B2 upload test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'B2 Upload test endpoint. Use POST to run the test.',
    endpoint: '/api/test/b2-upload'
  });
}
