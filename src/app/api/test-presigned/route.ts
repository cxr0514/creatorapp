import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUrl } from '@/lib/b2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storageKey = searchParams.get('key')
    
    if (!storageKey) {
      return NextResponse.json({ error: 'Storage key is required' }, { status: 400 })
    }
    
    console.log('[TEST-PRESIGNED] Generating presigned URL for key:', storageKey)
    
    const presignedUrl = await getPresignedUrl(storageKey, 3600)
    
    console.log('[TEST-PRESIGNED] Generated URL:', presignedUrl)
    
    return NextResponse.json({ 
      storageKey,
      presignedUrl,
      expiresIn: 3600,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[TEST-PRESIGNED] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate presigned URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
