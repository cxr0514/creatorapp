import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getPresignedUrl } from '@/lib/b2'

// Helper function to generate presigned URLs for clip files
async function generatePresignedClipUrl(clip: { storageUrl: string | null, storageKey: string | null }): Promise<string | null> {
  if (!clip.storageUrl) return null;
  
  try {
    // Check if this is a B2 URL that needs a presigned URL
    if (clip.storageUrl.includes('s3.us-east-005.backblazeb2.com') || clip.storageUrl.includes('Clipverse') || clip.storageUrl.includes('CreatorStorage')) {
      // If we have a storage key, use it directly
      if (clip.storageKey) {
        console.log('[CLIP-STREAM] Generating presigned URL for storage key:', clip.storageKey);
        return await getPresignedUrl(clip.storageKey, 3600); // 1 hour expiry
      }
      
      // Otherwise, try to extract the storage key from the URL
      const urlParts = clip.storageUrl.split('/');
      
      // Look for bucket name in URL and extract path after it
      let bucketIndex = urlParts.findIndex(part => part === 'Clipverse' || part === 'CreatorStorage');
      if (bucketIndex === -1) {
        // For direct B2 URLs like https://s3.us-east-005.backblazeb2.com/Clipverse/...
        bucketIndex = urlParts.findIndex(part => part === 'Clipverse' || part === 'CreatorStorage');
      }
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const storageKey = urlParts.slice(bucketIndex + 1).join('/');
        console.log('[CLIP-STREAM] Extracted storage key from URL:', storageKey);
        return await getPresignedUrl(storageKey, 3600); // 1 hour expiry
      }
      
      console.warn('[CLIP-STREAM] Could not extract storage key from B2 URL:', clip.storageUrl);
      return null;
    }
    
    // If it's not a B2 URL, return as-is (might be external CDN)
    return clip.storageUrl;
  } catch (error) {
    console.error('[CLIP-STREAM] Failed to generate presigned URL:', error);
    return null; // Return null if we can't generate presigned URL
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clipId = params.id
    
    if (!clipId || isNaN(parseInt(clipId))) {
      return NextResponse.json({ error: 'Valid clip ID is required' }, { status: 400 })
    }

    // Try to find the clip in the database first
    const clip = await prisma.clip.findFirst({
      where: {
        id: parseInt(clipId),
        user: {
          email: session.user.email
        }
      }
    })

    if (clip) {
      // Generate presigned URL for the database clip
      const presignedClipUrl = await generatePresignedClipUrl({ 
        storageUrl: clip.storageUrl, 
        storageKey: clip.storageKey 
      });

      if (presignedClipUrl) {
        // Redirect to the presigned URL for direct streaming
        return NextResponse.redirect(presignedClipUrl)
      }
    }

    // If no database clip found or presigned URL failed, try mock data
    // This is a fallback for the current mock implementation
    console.log('[CLIP-STREAM] No database clip found, checking mock data for clip:', clipId);
    
    // Import the mock clips from the main clips API
    // For now, return a placeholder response since mock clips don't have real video files
    return NextResponse.json({ 
      error: 'Clip video not yet processed or unavailable',
      message: 'This clip is using mock data. Please use the clip creation workflow to generate real clips.',
      clipId: parseInt(clipId)
    }, { status: 404 })

  } catch (error) {
    console.error('Error streaming clip:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
