import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { deleteVideoFromB2, getPresignedUrl } from '@/lib/b2'

// Helper function to generate presigned URLs for video files
async function generatePresignedVideoUrl(video: { storageUrl: string | null, storageKey: string | null }): Promise<string | null> {
  if (!video.storageUrl) return null;
  
  try {
    // Check if this is a B2 URL that needs a presigned URL
    if (video.storageUrl.includes('s3.us-east-005.backblazeb2.com') || video.storageUrl.includes('Clipverse') || video.storageUrl.includes('CreatorStorage')) {
      // If we have a storage key, use it directly
      if (video.storageKey) {
        console.log('[VIDEO-URL] Generating presigned URL for storage key:', video.storageKey);
        return await getPresignedUrl(video.storageKey, 3600); // 1 hour expiry
      }
      
      // Otherwise, try to extract the storage key from the URL
      const urlParts = video.storageUrl.split('/');
      
      // Look for bucket name in URL and extract path after it
      let bucketIndex = urlParts.findIndex(part => part === 'Clipverse' || part === 'CreatorStorage');
      if (bucketIndex === -1) {
        // For direct B2 URLs like https://s3.us-east-005.backblazeb2.com/Clipverse/...
        bucketIndex = urlParts.findIndex(part => part === 'Clipverse' || part === 'CreatorStorage');
      }
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const storageKey = urlParts.slice(bucketIndex + 1).join('/');
        console.log('[VIDEO-URL] Extracted storage key from URL:', storageKey);
        return await getPresignedUrl(storageKey, 3600); // 1 hour expiry
      }
      
      console.warn('[VIDEO-URL] Could not extract storage key from B2 URL:', video.storageUrl);
      return null;
    }
    
    // If it's not a B2 URL, return as-is (might be external CDN)
    return video.storageUrl;
  } catch (error) {
    console.error('[VIDEO-URL] Failed to generate presigned URL:', error);
    return null; // Return null if we can't generate presigned URL
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videoId = params.id
    
    if (!videoId || isNaN(parseInt(videoId))) {
      return NextResponse.json({ error: 'Valid video ID is required' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the video and verify ownership
    const video = await prisma.video.findFirst({
      where: {
        id: parseInt(videoId),
        userId: user.id
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 })
    }

    console.log(`Deleting video ${video.id} (${video.title}) for user ${user.id}`)

    let b2DeleteSuccess = false
    let b2DeleteError: string | undefined

    try {
      // Delete from B2 storage first
      await deleteVideoFromB2(video.storageKey)
      b2DeleteSuccess = true
      console.log(`Successfully deleted video from B2: ${video.storageKey}`)
    } catch (error) {
      b2DeleteError = error instanceof Error ? error.message : 'Unknown error'
      console.warn(`Failed to delete video from B2: ${b2DeleteError}`)
    }

    try {
      // Delete video from database
      await prisma.video.delete({
        where: { id: video.id }
      })

      console.log(`Successfully deleted video ${video.id} from database`)

      return NextResponse.json({ 
        success: true,
        message: 'Video deleted successfully',
        deletedVideo: {
          id: video.id,
          title: video.title,
          storageKey: video.storageKey
        },
        storage: {
          b2Deleted: b2DeleteSuccess,
          b2Error: b2DeleteError
        }
      })

    } catch (dbError) {
      console.error('Error deleting from database:', dbError)
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete video from database',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          storage: {
            b2Deleted: b2DeleteSuccess,
            b2Error: b2DeleteError
          }
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in DELETE video:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
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

    const videoId = params.id
    
    if (!videoId || isNaN(parseInt(videoId))) {
      return NextResponse.json({ error: 'Valid video ID is required' }, { status: 400 })
    }

    // Find the video and verify ownership
    const video = await prisma.video.findFirst({
      where: {
        id: parseInt(videoId),
        user: {
          email: session.user.email
        }
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 })
    }

    // Generate presigned URL for the video
    const presignedVideoUrl = await generatePresignedVideoUrl({ 
      storageUrl: video.storageUrl, 
      storageKey: video.storageKey 
    });

    const formattedVideo = {
      id: video.id,
      title: video.title,
      filename: video.title,
      url: presignedVideoUrl || video.storageUrl, // Use presigned URL if available, fallback to original
      publicId: video.storageKey,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      createdAt: video.uploadedAt.toISOString(),
      fileSize: video.fileSize
    }

    return NextResponse.json(formattedVideo)

  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
