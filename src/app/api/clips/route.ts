import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { cloudinary, generateClipThumbnail } from '@/lib/cloudinary'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For development/testing: Allow access even without session
    if (!session?.user?.email) {
      console.warn('No authenticated session found, returning empty clips list for development')
      return NextResponse.json({
        success: true,
        data: [],
        total: 0
      })
    }

    const { searchParams } = new URL(request.url)
    const sync = searchParams.get('sync') === 'true'

    if (sync) {
      // Sync with Cloudinary storage
      try {
        console.log('Syncing clips with Cloudinary...')
        
        // Get user folder path
        const userClipsPath = `creatorapp/users/${session.user.email}/clips`
        
        // Get clips from Cloudinary
        const cloudinaryResult = await cloudinary.search
          .expression(`folder:${userClipsPath}`)
          .with_field('context')
          .max_results(100)
          .execute()
        
        console.log(`Found ${cloudinaryResult.resources.length} clips in Cloudinary`)
        
        // Get existing clips from database
        const existingClips = await prisma.clip.findMany({
          where: {
            user: {
              email: session.user.email
            }
          }
        })
        
        const existingCloudinaryIds = new Set(existingClips.map(c => c.cloudinaryId).filter(Boolean))
        
        // Add missing clips to database
        for (const resource of cloudinaryResult.resources) {
          if (!existingCloudinaryIds.has(resource.public_id)) {
            console.log(`Adding missing clip: ${resource.public_id}`)
            
            // Try to find the parent video based on context or naming convention
            const parentVideoId = resource.context?.video_id || null
            
            await prisma.clip.create({
              data: {
                title: resource.filename || resource.public_id.split('/').pop() || 'Untitled Clip',
                cloudinaryId: resource.public_id,
                cloudinaryUrl: resource.secure_url,
                thumbnailUrl: resource.secure_url.replace(/\.[^/.]+$/, '.jpg'),
                status: 'ready',
                startTime: 0,
                endTime: resource.duration || 30,
                user: {
                  connect: {
                    email: session.user.email
                  }
                },
                ...(parentVideoId && {
                  video: {
                    connect: {
                      id: parseInt(parentVideoId)
                    }
                  }
                })
              }
            })
          }
        }
      } catch (syncError) {
        console.error('Error syncing clips with Cloudinary:', syncError)
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
            cloudinaryId: true
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
      thumbnailUrl: clip.thumbnailUrl || (clip.video.cloudinaryId ? 
        generateClipThumbnail(clip.video.cloudinaryId, clip.startTime || 0) : 
        null),
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

    // Check if Cloudinary is configured for video processing
    const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                                process.env.CLOUDINARY_API_KEY && 
                                process.env.CLOUDINARY_API_SECRET
    console.log('[API/CLIPS POST] Cloudinary configured:', hasCloudinaryConfig);
    console.log('[API/CLIPS POST] Video Cloudinary ID:', video.cloudinaryId);


    let clipUrl = `https://example.com/clips/${Date.now()}-${title}.mp4`
    let clipPublicId = `clip_${Date.now()}_${videoId}`
    let thumbnailUrl = null

    if (hasCloudinaryConfig && video.cloudinaryId) {
      console.log('[API/CLIPS POST] Attempting Cloudinary processing.');
      try {
        // Generate thumbnail for the clip from the original video at the start time
        try {
          thumbnailUrl = generateClipThumbnail(video.cloudinaryId, startTime, {
            width: 640,
            height: 360,
            quality: 'auto'
          })
          console.log('✅ [API/CLIPS POST] Generated clip thumbnail URL:', thumbnailUrl)
        } catch (thumbError) {
          console.warn('⚠️ [API/CLIPS POST] Failed to generate clip thumbnail URL:', thumbError)
          // Continue without thumbnail - the UI will show a fallback icon
        }

        // Create user-specific folder for clips
        const userClipsFolder = `creator_uploads/clips/${user.id}`
        const clipFileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${startTime}s_${endTime}s`
        
        console.log(`[API/CLIPS POST] Attempting to upload to Cloudinary. Folder: ${userClipsFolder}, Filename: ${clipFileName}`);
        // Generate clip using Cloudinary's video processing
        // Create a new video asset with the clipped content
        const clipResult = await cloudinary.uploader.upload(
          cloudinary.url(video.cloudinaryId, {
            resource_type: 'video',
            start_offset: `${startTime}s`,
            end_offset: `${endTime}s`,
            format: 'mp4',
            quality: 'auto',
          }),
          {
            resource_type: 'video',
            folder: userClipsFolder,
            public_id: clipFileName,
            overwrite: true,
            use_filename: false,
            unique_filename: false,
          }
        )

        clipUrl = clipResult.secure_url
        clipPublicId = clipResult.public_id
        
        console.log('[API/CLIPS POST] Created clip asset in Cloudinary:', clipPublicId)
        console.log('[API/CLIPS POST] Clip URL:', clipUrl)
      } catch (error) {
        console.error('[API/CLIPS POST] Error creating Cloudinary clip asset (primary attempt):', error)
        // Fall back to transformation URL approach
        try {
          console.log('[API/CLIPS POST] Attempting Cloudinary transformation URL fallback.');
          const clipTransformation = cloudinary.url(video.cloudinaryId, {
            resource_type: 'video',
            start_offset: `${startTime}s`,
            end_offset: `${endTime}s`,
            format: 'mp4',
            quality: 'auto',
          })

          clipPublicId = `creator_uploads/clips/${user.id}/clip_${Date.now()}_${videoId}_${startTime}_${endTime}`
          clipUrl = clipTransformation
          
          console.log('[API/CLIPS POST] Using clip transformation URL as fallback:', clipUrl)
        } catch (fallbackError) {
          console.error('[API/CLIPS POST] Error creating clip transformation (fallback attempt):', fallbackError)
          // If fallback also fails, we might still proceed with mock/default URLs, or we could return an error.
          // For now, it proceeds, and prisma.create might fail or save with mock URLs.
        }
      }
    } else {
      console.warn('[API/CLIPS POST] Cloudinary not configured or video missing cloudinaryId. Using mock clip URL.')
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
      cloudinaryId: clipPublicId,
      cloudinaryUrl: clipUrl,
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
        url: clip.cloudinaryUrl
      }
    })
  } catch (error) {
    console.error('[API/CLIPS POST] Critical error in POST handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
