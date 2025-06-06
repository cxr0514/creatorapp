import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { processVideoClipFromStorage } from '@/lib/video/clip-processor'
import { getB2Config, getPresignedUrl } from '@/lib/b2'

// Helper function to generate presigned URLs for thumbnails
async function generatePresignedThumbnailUrl(thumbnailUrl: string | null): Promise<string | null> {
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

// initialize background workers on server start
// initializeWorkers()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.warn('No authenticated session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sync = searchParams.get('sync') === 'true'

    if (sync) {
      // For clips, sync just means refreshing the data since clips are database records
      // referencing videos. The actual video files are synced through the storage sync API.
      // This is mainly kept for backward compatibility with the old sync approach.
      console.log('Clips sync requested - this will fetch current clips from database')
    }

    const clips = await prisma.clip.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            storageKey: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Generate presigned URLs for thumbnails
    const formattedClips = await Promise.all(clips.map(async clip => {
      const presignedThumbnailUrl = await generatePresignedThumbnailUrl(clip.thumbnailUrl);
      
      return {
        id: clip.id,
        title: clip.title,
        description: clip.description,
        hashtags: clip.hashtags,
        tags: clip.tags,
        startTime: clip.startTime || 0,
        endTime: clip.endTime || 0,
        aspectRatio: clip.aspectRatio || '16:9',
        createdAt: clip.createdAt.toISOString(),
        video: {
          id: clip.video.id,
          title: clip.video.title,
          filename: clip.video.title // Use title as filename for now
        },
        thumbnailUrl: presignedThumbnailUrl, // Use presigned URL
        status: 'ready' as const // Assume all clips are ready for now
      };
    }));

    return NextResponse.json(formattedClips)
  } catch (error) {
    console.error('Error fetching clips:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('[API/CLIPS POST DEBUG] Handler invoked, request URL:', request.url)
  try {
    console.log('[API/CLIPS POST DEBUG] Parsing session...')
    const session = await getServerSession(authOptions)
    console.log('[API/CLIPS POST DEBUG] Session result:', !!session, session?.user?.email)
    
    if (!session?.user?.email) {
      console.warn('[API/CLIPS POST] No authenticated session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[API/CLIPS POST DEBUG] Authorization passed')
    console.log('[API/CLIPS POST] Session retrieved for email:', session.user.email);

    // Handle both JSON and FormData requests
    let videoIdStr: string, title: string, description: string | null, 
        hashtagsStr: string, tagsStr: string, startTimeStr: string, 
        endTimeStr: string, aspectRatio: string, clipCountStr: string;
    
    const contentType = request.headers.get('content-type') || '';
    console.log('[API/CLIPS POST DEBUG] Content-Type:', contentType);
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await request.json();
      console.log('[API/CLIPS POST DEBUG] JSON body received:', body);
      
      videoIdStr = body.videoId?.toString() || '';
      title = body.title || 'Test Clip';
      description = body.description || null;
      hashtagsStr = body.hashtags?.join(',') || '';
      tagsStr = body.tags?.join(',') || '';
      startTimeStr = body.startTime?.toString() || '';
      endTimeStr = body.endTime?.toString() || '';
      aspectRatio = body.aspectRatio || '16:9';
      clipCountStr = body.clipCount?.toString() || '1';
    } else {
      // Handle FormData request
      const formData = await request.formData()
      console.log('[API/CLIPS POST DEBUG] Raw FormData keys:', Array.from(formData.keys()))
      
      videoIdStr = formData.get('videoId') as string;
      title = formData.get('title') as string
      description = formData.get('description') as string || null
      hashtagsStr = formData.get('hashtags') as string;
      tagsStr = formData.get('tags') as string;
      startTimeStr = formData.get('startTime') as string;
      endTimeStr = formData.get('endTime') as string;
      aspectRatio = formData.get('aspectRatio') as string || '16:9'
      clipCountStr = formData.get('clipCount') as string;
    }

    console.log('[API/CLIPS POST] Raw request data received:', {
      videoIdStr, title, description, hashtagsStr, tagsStr, startTimeStr, endTimeStr, aspectRatio, clipCountStr
    });

    const videoId = parseInt(videoIdStr)
    const hashtags = hashtagsStr ? hashtagsStr.split(',') : []
    const tags = tagsStr ? tagsStr.split(',') : []
    const startTime = parseFloat(startTimeStr)
    const endTime = parseFloat(endTimeStr)
    const clipCount = clipCountStr ? parseInt(clipCountStr) : 1

    console.log('[API/CLIPS POST] Parsed form data:', {
      videoId, title, description, hashtags, tags, startTime, endTime, aspectRatio, clipCount
    });
    console.log('[API/CLIPS POST DEBUG] Validating parsed input...')

    if (!videoId || !title || startTime === undefined || Number.isNaN(startTime) || endTime === undefined || Number.isNaN(endTime)) {
      console.error('[API/CLIPS POST] Missing or invalid required fields after parsing:', { videoId, title, startTime, endTime });
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 })
    }

    if (startTime >= endTime) {
      console.error('[API/CLIPS POST] Invalid time range: startTime >= endTime');
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    if (clipCount < 1 || clipCount > 10) {
      console.error('[API/CLIPS POST] Invalid clipCount:', clipCount);
      return NextResponse.json({ error: 'Clip count must be between 1 and 10' }, { status: 400 })
    }

    // Verify the video belongs to the current user
    console.log('[API/CLIPS POST DEBUG] Using email for video lookup:', session.user.email);
    
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        user: {
          email: session.user.email
        }
      }
    })

    if (!video) {
      console.error('[API/CLIPS POST] Video not found for ID:', videoId);
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }
    console.log('[API/CLIPS POST] Video found:', video.id, video.title);

    if (video.duration && endTime > video.duration) {
      console.error('[API/CLIPS POST] End time exceeds video duration');
      return NextResponse.json({ error: 'End time exceeds video duration' }, { status: 400 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log('[API/CLIPS POST] User not found, creating new user for email:', session.user.email);
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session?.user?.name || session.user.email,
        }
      })
      console.log('[API/CLIPS POST] New user created:', user.id);
    } else {
      console.log('[API/CLIPS POST] Existing user found:', user.id);
    }

    // Determine if B2 is configured for clip upload
    const { hasValidB2Credentials } = getB2Config()
    console.log('[API/CLIPS POST] B2 available:', hasValidB2Credentials)
    console.log('[API/CLIPS POST] Video storage key:', video.storageKey);

    // Create storage key for the clip - organized in clips folder structure
    const clipStorageKey = `clips/${user.id}/clip_${Date.now()}_${videoId}_${Math.round(startTime)}_${Math.round(endTime)}.mp4`
    let clipUrl: string
    let thumbnailUrl: string | null = null
    let clipStatus: string = 'draft'

    if (hasValidB2Credentials && video.storageKey) {
      console.log('[API/CLIPS POST] Processing clip synchronously...');
      // Set initial status for processing
      clipStatus = 'pending'
      clipUrl = '' // Will be updated after processing
      thumbnailUrl = null
    } else {
      console.log('[API/CLIPS POST] B2 not available, using fragment URL fallback');
      // Fallback to fragment URL approach if B2 is not configured
      clipUrl = `${video.storageUrl}#t=${startTime},${endTime}`
      clipStatus = 'ready'
    }

    const clipDataForDb = {
      title,
      description: description || null,
      hashtags: Array.isArray(hashtags) ? hashtags : [],
      tags: Array.isArray(tags) ? tags : [],
      startTime: Math.round(startTime),
      endTime: Math.round(endTime),
      aspectRatio,
      videoId,
      userId: user.id,
      storageKey: clipStorageKey,
      storageUrl: clipUrl,
      thumbnailUrl,
      status: clipStatus
    }
    console.log('[API/CLIPS POST] Data before creating clip in DB:', clipDataForDb)

    let clip
    try {
      clip = await prisma.clip.create({ data: clipDataForDb })
      console.log('[API/CLIPS POST DEBUG] Clip record created:', clip)
    } catch (dbErr) {
      console.error('[API/CLIPS POST DEBUG] Error creating clip record:', dbErr)
      throw dbErr
    }

    // Attempt synchronous processing and upload
    try {
      console.log('[API/CLIPS POST DEBUG] Starting video clip processing upload')
      const result = await processVideoClipFromStorage(
        video.storageKey,
        { startTime, endTime, aspectRatio, quality: 'medium' },
        clipStorageKey
      )
      await prisma.clip.update({ where: { id: clip.id }, data: {
        storageUrl: result.clipUrl,
        thumbnailUrl: result.thumbnailUrl,
        status: 'ready'
      }})
      console.log('[API/CLIPS POST] Clip uploaded successfully:', result.clipUrl)
      console.log('[API/CLIPS POST DEBUG] B2 upload result:', result)
      return NextResponse.json({
        clipId: clip.id,
        message: 'Clip created and uploaded successfully',
        status: 'ready',
        clip: {
          id: clip.id,
          title: clip.title,
          startTime: clip.startTime,
          endTime: clip.endTime,
          status: 'ready',
          url: result.clipUrl
        }
      })
    } catch (err) {
      console.error('[API/CLIPS POST DEBUG] Clip processing/upload failed:', err)
      
      // Check if it's a video not found error (common in development/testing)
      if (err instanceof Error && err.message.includes('Video file not found in storage')) {
        console.log('[API/CLIPS POST] Video file not found - this might be a test scenario. Updating clip status to indicate this.')
        await prisma.clip.update({ 
          where: { id: clip.id }, 
          data: { 
            status: 'error', 
            errorMessage: 'Source video file not found in storage. Please ensure the video has been properly uploaded to B2 storage before creating clips.' 
          } 
        })
        
        return NextResponse.json({
          clipId: clip.id,
          message: 'Clip record created, but source video file not found in storage',
          status: 'error',
          error: 'Source video file not found in storage. Please ensure the video has been properly uploaded.',
          clip: {
            id: clip.id,
            title: clip.title,
            startTime: clip.startTime,
            endTime: clip.endTime,
            status: 'error',
            url: ''
          }
        })
      }
      
      await prisma.clip.update({ where: { id: clip.id }, data: { status: 'error', errorMessage: err instanceof Error ? err.message : String(err) } })
      // Fallback to fragment URL approach when processing fails
    }

    // Return created clip when using fragment URL
    return NextResponse.json({ 
      clipId: clip.id,
      message: 'Clip created successfully',
      status: 'ready',
      clip: {
        id: clip.id,
        title: clip.title,
        startTime: clip.startTime,
        endTime: clip.endTime,
        status: 'ready',
        url: clip.storageUrl
      }
    })
  } catch (error) {
    console.error('[API/CLIPS POST] Critical error in POST handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
