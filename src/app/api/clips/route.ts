import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { cloudinary, generateClipThumbnail } from '@/lib/cloudinary'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { videoId, title, description, hashtags = [], tags = [], startTime, endTime, aspectRatio = '16:9', clipCount = 1 } = await request.json()

    if (!videoId || !title || startTime === undefined || endTime === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    if (clipCount < 1 || clipCount > 10) {
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
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.duration && endTime > video.duration) {
      return NextResponse.json({ error: 'End time exceeds video duration' }, { status: 400 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          image: session.user.image,
        }
      })
    }

    // Check if Cloudinary is configured for video processing
    const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                                process.env.CLOUDINARY_API_KEY && 
                                process.env.CLOUDINARY_API_SECRET

    let clipUrl = `https://example.com/clips/${Date.now()}-${title}.mp4`
    let clipPublicId = `clip_${Date.now()}_${videoId}`
    let thumbnailUrl = null

    if (hasCloudinaryConfig && video.cloudinaryId) {
      try {
        // Generate thumbnail for the clip from the original video at the start time
        try {
          thumbnailUrl = generateClipThumbnail(video.cloudinaryId, startTime, {
            width: 640,
            height: 360,
            quality: 'auto'
          })
          console.log('✅ Generated clip thumbnail URL:', thumbnailUrl)
        } catch (thumbError) {
          console.warn('⚠️ Failed to generate clip thumbnail URL:', thumbError)
          // Continue without thumbnail - the UI will show a fallback icon
        }

        // Create user-specific folder for clips
        const userClipsFolder = `creator_uploads/clips/${user.id}`
        const clipFileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${startTime}s_${endTime}s`
        
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
        
        console.log('Created clip asset in Cloudinary:', clipPublicId)
        console.log('Clip URL:', clipUrl)
      } catch (error) {
        console.error('Error creating Cloudinary clip asset:', error)
        // Fall back to transformation URL approach
        try {
          const clipTransformation = cloudinary.url(video.cloudinaryId, {
            resource_type: 'video',
            start_offset: `${startTime}s`,
            end_offset: `${endTime}s`,
            format: 'mp4',
            quality: 'auto',
          })

          clipPublicId = `creator_uploads/clips/${user.id}/clip_${Date.now()}_${videoId}_${startTime}_${endTime}`
          clipUrl = clipTransformation
          
          console.log('Using clip transformation URL as fallback:', clipUrl)
        } catch (fallbackError) {
          console.error('Error creating clip transformation:', fallbackError)
        }
      }
    } else {
      console.warn('Cloudinary not configured, using mock clip URL')
    }

    const clip = await prisma.clip.create({
      data: {
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
      }
    })

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
    console.error('Error creating clip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
