import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { listAllB2Objects, uploadToB2, BUCKET_NAME } from '@/lib/b2'

export async function GET(request: NextRequest) {
  try {
    // Temporarily remove auth for debugging
    // const session = await getServerSession(authOptions)
    // 
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('[DEBUG-B2] Starting B2 diagnostic...')
    console.log('[DEBUG-B2] Environment variables:')
    console.log(`[DEBUG-B2] B2_BUCKET_NAME from env: ${process.env.B2_BUCKET_NAME}`)
    console.log(`[DEBUG-B2] B2_KEY_ID from env: ${process.env.B2_KEY_ID}`)
    console.log(`[DEBUG-B2] B2_APP_KEY from env: ${process.env.B2_APP_KEY ? process.env.B2_APP_KEY.substring(0,8) + '...' : 'NOT SET'}`)
    console.log(`[DEBUG-B2] BUCKET_NAME constant: ${BUCKET_NAME}`)
    
    // Get all objects in the bucket
    const allObjects = await listAllB2Objects()
    
    console.log(`[DEBUG-B2] Found ${allObjects.length} objects total`)
    
    return NextResponse.json({
      success: true,
      bucketName: BUCKET_NAME,
      environment: {
        B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
        B2_KEY_ID: process.env.B2_KEY_ID ? process.env.B2_KEY_ID.substring(0,8) + '...' : 'NOT SET',
        B2_APP_KEY: process.env.B2_APP_KEY ? process.env.B2_APP_KEY.substring(0,8) + '...' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV
      },
      totalObjects: allObjects.length,
      objects: allObjects.slice(0, 50), // Limit to first 50 for readability
      message: `Found ${allObjects.length} objects in B2 bucket '${BUCKET_NAME}'`,
      // userEmail: session.user.email
    })
  } catch (error) {
    console.error('[DEBUG-B2] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      bucketName: BUCKET_NAME
    }, { status: 500 })
  }
}

// POST method for test upload
export async function POST(request: NextRequest) {
  try {
    // Temporarily remove auth for debugging
    // const session = await getServerSession(authOptions)
    // 
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('[DEBUG-B2-UPLOAD] Starting test upload...')
    
    // Create a small test file
    const testContent = `Test file created at ${new Date().toISOString()}`
    const testBuffer = Buffer.from(testContent, 'utf-8')
    const testKey = `debug/test-${Date.now()}.txt`
    
    console.log(`[DEBUG-B2-UPLOAD] Uploading test file to key: ${testKey}`)
    
    // Upload the test file
    const uploadResult = await uploadToB2(testBuffer, testKey, 'text/plain')
    
    console.log('[DEBUG-B2-UPLOAD] Upload completed, checking if visible...')
    
    // Immediately check if we can see the uploaded file
    const allObjects = await listAllB2Objects()
    const uploadedFile = allObjects.find(obj => obj.key === testKey)
    
    return NextResponse.json({
      success: true,
      uploadResult,
      testFileVisible: !!uploadedFile,
      testFileDetails: uploadedFile || null,
      totalObjectsAfterUpload: allObjects.length,
      bucketName: BUCKET_NAME,
      message: uploadedFile 
        ? 'Upload successful and file is visible in bucket' 
        : 'Upload completed but file not visible in bucket listing'
    })
  } catch (error) {
    console.error('[DEBUG-B2-UPLOAD] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      bucketName: BUCKET_NAME
    }, { status: 500 })
  }
} 