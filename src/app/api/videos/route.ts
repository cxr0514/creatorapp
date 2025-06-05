import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { uploadVideoToB2, syncUserVideosFromB2Enhanced, deleteVideoFromB2, smartSync, checkStorageHealth } from '@/lib/b2'

export async function GET(request: NextRequest) {
  try {
    // Check for authenticated session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('No authenticated session found, returning empty videos list for development')
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const syncRequested = searchParams.get('sync') === 'true'
    const healthCheck = searchParams.get('health') === 'true'
    const strategy = searchParams.get('strategy') as 'fast' | 'full' | 'repair' | 'smart' | undefined

    console.log('Session callback - User ID set:', (session.user as any)?.id)
    
    // Handle health check request
    if (healthCheck) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const healthReport = await checkStorageHealth(user.id)
        return NextResponse.json({
          health: healthReport,
          timestamp: new Date().toISOString()
        })
      } catch (healthError) {
        console.error('Error during storage health check:', healthError)
        return NextResponse.json({ 
          error: 'Health check failed',
          health: {
            isHealthy: false,
            recommendations: ['Health check failed - please try again later']
          }
        }, { status: 500 })
      }
    }

    // Handle sync request with enhanced features
    if (syncRequested) {
      try {
        console.log('Starting comprehensive sync with B2...')
        
        // Get user
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })

        if (user) {
          // Get current database video count for smart sync
          const dbVideoCount = await prisma.video.count({
            where: { userId: user.id }
          })

          let syncResult
          let b2Videos: any[] = []
          let recommendations: string[] = []

          // Determine sync strategy
          if (strategy === 'smart' || !strategy) {
            // Use smart sync to automatically determine best approach
            const smartSyncResult = await smartSync(user.id, dbVideoCount)
            b2Videos = smartSyncResult.b2Videos
            recommendations = smartSyncResult.recommendations
            
            console.log(`[SMART-SYNC] Using ${smartSyncResult.strategy} strategy`)
            console.log(`[SMART-SYNC] Scan took ${smartSyncResult.metrics.scanDuration}ms`)
            console.log(`[SMART-SYNC] Storage used: ${(smartSyncResult.metrics.storageUsed / 1024 / 1024).toFixed(2)} MB`)
          } else {
            // Use traditional enhanced sync
            b2Videos = await syncUserVideosFromB2Enhanced(user.id)
            recommendations.push(`Using ${strategy} sync strategy`)
          }
          
          console.log(`Found ${b2Videos.length} videos in B2`)
          
          // Get existing videos from database
          const existingVideos = await prisma.video.findMany({
            where: { userId: user.id }
          })
          console.log(`Found ${existingVideos.length} videos in database`)
          
          const existingKeys = new Set(existingVideos.map(v => v.storageKey))
          const b2Keys = new Set(b2Videos.map(v => v.key))
          
          let addedToDatabase = 0
          let removedFromB2 = 0
          let removedFromDatabase = 0
          const errors: string[] = []
          
          // 1. Add missing videos from B2 to database
          for (const b2Video of b2Videos) {
            if (!existingKeys.has(b2Video.key)) {
              try {
                console.log(`Adding missing video to database: ${b2Video.key}`)
                
                const title = b2Video.filename?.replace(/\.[^/.]+$/, '') || 'Untitled'
                
                await prisma.video.create({
                  data: {
                    title,
                    storageUrl: b2Video.url,
                    storageKey: b2Video.key,
                    fileSize: b2Video.size,
                    userId: user.id,
                    uploadedAt: b2Video.uploadedAt || new Date()
                  }
                })
                addedToDatabase++
              } catch (error) {
                console.error(`Error adding video ${b2Video.key} to database:`, error)
                errors.push(`Failed to add ${b2Video.filename} to database`)
              }
            }
          }
          
          // 2. Remove orphaned database records (videos that exist in DB but not in B2)
          const removeOrphaned = searchParams.get('removeOrphaned') !== 'false' // Default to true
          if (removeOrphaned) {
            for (const dbVideo of existingVideos) {
              if (!b2Keys.has(dbVideo.storageKey)) {
                try {
                  console.log(`Removing orphaned database record: ${dbVideo.storageKey}`)
                  
                  // Remove from database since it doesn't exist in B2
                  await prisma.video.delete({
                    where: { id: dbVideo.id }
                  })
                  removedFromDatabase++
                  console.log(`Removed orphaned video record: ${dbVideo.title}`)
                } catch (error) {
                  console.error(`Error removing orphaned video ${dbVideo.id}:`, error)
                  errors.push(`Failed to remove orphaned record for ${dbVideo.title}`)
                }
              }
            }
          }
          
          // 3. Optional: Clean up B2 videos that don't have database records
          const cleanupOrphans = searchParams.get('cleanup') === 'true'
          if (cleanupOrphans) {
            for (const b2Video of b2Videos) {
              const hasDbRecord = existingVideos.some(v => v.storageKey === b2Video.key)
              if (!hasDbRecord) {
                try {
                  console.log(`Removing orphaned B2 video: ${b2Video.key}`)
                  const deleteResult = await deleteVideoFromB2(b2Video.key, user.id)
                  if (deleteResult.success) {
                    removedFromB2++
                  } else {
                    errors.push(`Failed to remove orphaned file: ${b2Video.filename}`)
                  }
                } catch (error) {
                  console.error(`Error removing orphaned B2 video ${b2Video.key}:`, error)
                  errors.push(`Failed to remove orphaned file: ${b2Video.filename}`)
                }
              }
            }
          }
          
          console.log(`Sync completed: +${addedToDatabase} to DB, -${removedFromDatabase} from DB, -${removedFromB2} from B2, ${errors.length} errors`)
          
          // Calculate storage usage
          const totalStorageUsed = b2Videos.reduce((sum, video) => sum + (video.size || 0), 0)
          
          // Add comprehensive sync results to response headers
          const response = NextResponse.json([], {
            headers: {
              'X-Sync-Added': addedToDatabase.toString(),
              'X-Sync-Removed-DB': removedFromDatabase.toString(),
              'X-Sync-Removed-B2': removedFromB2.toString(),
              'X-Sync-Errors': errors.length.toString(),
              'X-Sync-Status': errors.length === 0 ? 'success' : 'partial',
              'X-Sync-Strategy': strategy || 'smart',
              'X-Storage-Used': totalStorageUsed.toString(),
              'X-Storage-Count': b2Videos.length.toString(),
              'X-Sync-Recommendations': recommendations.join('; ')
            }
          })
          
          // If there were errors, include them in the response
          if (errors.length > 0) {
            console.warn('Sync completed with errors:', errors)
          }
          
          // If there were recommendations, log them
          if (recommendations.length > 0) {
            console.log('Sync recommendations:', recommendations)
          }
        }
      } catch (syncError) {
        console.error('Error during comprehensive sync with B2:', syncError)
        // Continue with regular fetch even if sync fails
        return NextResponse.json({ 
          error: 'Sync failed',
          details: syncError instanceof Error ? syncError.message : 'Unknown sync error'
        }, { 
          status: 500,
          headers: {
            'X-Sync-Status': 'failed'
          }
        })
      }
    }

    // Get updated videos from database
    const videos = await prisma.video.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        _count: {
          select: {
            clips: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      filename: video.title, // Use title as filename since we store title based on filename
      url: video.storageUrl,
      publicId: video.storageKey,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      createdAt: video.uploadedAt.toISOString(),
      clipCount: video._count.clips
    }))

    return NextResponse.json(formattedVideos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Video upload - Session check:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (session?.user as any)?.id 
    })
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 })
    }

    // Validate file size (max 500MB for better user experience)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 500MB' }, { status: 400 })
    }

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      // If user doesn't exist, create them (fallback)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          image: session.user.image,
          emailVerified: new Date(),
        }
      })
    }

    // Convert file to buffer for B2 upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Backblaze B2
    console.log('Uploading to B2 for user:', user.id)

    const uploadResult = await uploadVideoToB2(buffer, user.id, file.name)

    // Create video record in database
    const fileName = file.name
    const title = fileName.replace(/\.[^/.]+$/, '') // Remove extension
    
    const video = await prisma.video.create({
      data: {
        title,
        storageUrl: uploadResult.url,
        storageKey: uploadResult.key,
        fileSize: uploadResult.size,
        userId: user.id
      }
    })

    console.log('Video created in database:', video.id)

    return NextResponse.json({ 
      videoId: video.id,
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        title: video.title,
        url: video.storageUrl,
        thumbnailUrl: video.thumbnailUrl,
        fileSize: video.fileSize
      }
    })
  } catch (error) {
    console.error('Video upload error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload video'
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('socket hang up')) {
        errorMessage = 'Upload connection failed. Please check your internet connection and try again.'
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo ENOTFOUND')) {
        errorMessage = 'Cannot connect to upload service. Please check your internet connection.'
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Upload timed out. Please try with a smaller file or check your connection.'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Upload service is temporarily unavailable. Please try again later.'
      } else if (error.message.includes('Invalid') || error.message.includes('invalid')) {
        errorMessage = 'Invalid file format. Please upload a valid video file.'
      } else if (error.message.includes('File size') || error.message.includes('too large')) {
        errorMessage = 'File is too large. Please upload a file smaller than 500MB.'
      } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        errorMessage = 'Authentication failed. Please log in and try again.'
      } else {
        errorMessage = error.message || errorMessage
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('id')
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
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

    console.log(`Deleting video ${video.id} for user ${user.id}`)

    try {
      // Delete from B2 storage first
      const deleteResult = await deleteVideoFromB2(video.storageKey, user.id)
      
      if (!deleteResult.success) {
        console.warn(`Failed to delete video from B2: ${deleteResult.error}`)
        // Continue with database deletion even if B2 deletion fails
      }

      // Delete associated clips first (foreign key constraint)
      const deletedClips = await prisma.clip.deleteMany({
        where: { videoId: video.id }
      })

      console.log(`Deleted ${deletedClips.count} associated clips`)

      // Delete video from database
      await prisma.video.delete({
        where: { id: video.id }
      })

      console.log(`Successfully deleted video ${video.id} from database`)

      return NextResponse.json({ 
        message: 'Video deleted successfully',
        deletedVideo: {
          id: video.id,
          title: video.title,
          storageKey: video.storageKey
        },
        deletedClips: deletedClips.count,
        b2Deleted: deleteResult.success
      })

    } catch (deleteError) {
      console.error('Error during video deletion:', deleteError)
      
      // If B2 deletion succeeded but database deletion failed, we have an inconsistency
      // This should be handled by the sync functionality
      return NextResponse.json(
        { 
          error: 'Failed to delete video completely. Please try syncing to resolve any inconsistencies.',
          details: deleteError instanceof Error ? deleteError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in DELETE video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
