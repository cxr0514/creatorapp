import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { syncUserClipsFromB2 } from '@/lib/b2'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For development/testing: Allow access even without session
    if (!session?.user?.email) {
      console.warn('No authenticated session found, returning empty clips list for development')
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const sync = searchParams.get('sync') === 'true'

    if (sync) {
      // Sync with B2 storage
      try {
        console.log('Syncing clips with B2...')
        
        // Get user
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })

        if (user) {
          const b2Clips = await syncUserClipsFromB2(user.id)
          console.log(`Found ${b2Clips.length} clips in B2`)
          
          // Get existing clips from database
          const existingClips = await prisma.clip.findMany({
            where: { userId: user.id }
          })
          
          const existingKeys = new Set(existingClips.map(c => c.storageKey))
          
          // Add missing clips to database - Note: This is simplified
          // In a real implementation, you'd need to parse metadata to extract video relationships
          for (const resource of b2Clips) {
            if (!existingKeys.has(resource.key)) {
              console.log(`Adding missing clip: ${resource.key}`)
              
              // For now, create clips without video association
              // You'd need additional metadata to properly link clips to videos
              await prisma.clip.create({
                data: {
                  title: resource.filename?.replace(/\.[^/.]+$/, '') || 'Untitled Clip',
                  storageKey: resource.key,
                  storageUrl: resource.url,
                  status: 'ready',
                  startTime: 0,
                  endTime: 30, // Default duration
                  userId: user.id,
                  // Note: videoId would need to be determined from metadata
                  videoId: 1 // Placeholder - you'd need proper video linking logic
                }
              })
            }
          }
        }
      } catch (syncError) {
        console.error('Error syncing clips with B2:', syncError)
        // Continue with regular fetch even if sync fails
      }
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

    const formattedClips = clips.map(clip => ({
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
      thumbnailUrl: clip.thumbnailUrl || null, // Remove auto-generation for now
      status: 'ready' as const // Assume all clips are ready for now
    }))

    return NextResponse.json(formattedClips)
  } catch (error) {
    console.error('Error fetching clips:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.error('[API/CLIPS POST] Unauthorized: No session email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[API/CLIPS POST] Session retrieved for email:', session.user.email);

    const formData = await request.formData()
    const videoIdStr = formData.get('videoId') as string;
    const title = formData.get('title') as string
    const description = formData.get('description') as string || null
    const hashtagsStr = formData.get('hashtags') as string;
    const tagsStr = formData.get('tags') as string;
    const startTimeStr = formData.get('startTime') as string;
    const endTimeStr = formData.get('endTime') as string;
    const aspectRatio = formData.get('aspectRatio') as string || '16:9'
    const clipCountStr = formData.get('clipCount') as string;

    console.log('[API/CLIPS POST] Raw FormData received:', {
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
          name: session.user.name || session.user.email,
          image: session.user.image,
        }
      })
      console.log('[API/CLIPS POST] New user created:', user.id);
    } else {
      console.log('[API/CLIPS POST] Existing user found:', user.id);
    }

    // Check if we have B2 configuration for video processing
    const hasB2Config = process.env.B2_ACCESS_KEY_ID && 
                        process.env.B2_SECRET_ACCESS_KEY && 
                        process.env.B2_BUCKET_NAME
    console.log('[API/CLIPS POST] B2 configured:', hasB2Config);
    console.log('[API/CLIPS POST] Video storage key:', video.storageKey);

    // For now, we'll create a simple clip record without actual video processing
    // In a full implementation, you'd extract the clip from the source video
    let clipUrl = `${video.storageUrl}#t=${startTime},${endTime}` // Fragment URL approach
    const clipStorageKey = `creator_uploads/clips/${user.id}/clip_${Date.now()}_${videoId}_${startTime}_${endTime}.mp4`
    const thumbnailUrl = null

    if (hasB2Config && video.storageKey) {
      console.log('[API/CLIPS POST] B2 processing would be implemented here.');
      // TODO: Implement actual video clip extraction using B2 and FFmpeg
      // For now, we create a placeholder clip record
      
      // In a real implementation, you would:
      // 1. Download the video segment from B2
      // 2. Use FFmpeg to extract the clip
      // 3. Upload the clip back to B2
      // 4. Generate a thumbnail
      
      clipUrl = `${process.env.B2_CDN_URL || process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${clipStorageKey}`
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
      thumbnailUrl
    };
    console.log('[API/CLIPS POST] Data before creating clip in DB:', clipDataForDb);

    const clip = await prisma.clip.create({
      data: clipDataForDb
    })
    console.log('[API/CLIPS POST] Clip created successfully in DB. Clip ID:', clip.id);

    // In a real application, you would trigger video processing here
    // For now, return the created clip
    return NextResponse.json({ 
      clipId: clip.id,
      message: 'Clip created successfully',
      clip: {
        id: clip.id,
        title: clip.title,
        startTime: clip.startTime,
        endTime: clip.endTime,
        url: clip.storageUrl
      }
    })
  } catch (error) {
    console.error('[API/CLIPS POST] Critical error in POST handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
