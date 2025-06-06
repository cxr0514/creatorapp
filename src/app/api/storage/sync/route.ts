import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { 
  smartSync, 
  checkStorageHealth, 
  syncStorageWithProgress,
  type SyncOptions,
  type SyncProgress
} from '@/lib/b2'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/storage/sync - Get storage sync status and health
 * Query parameters:
 * - action: 'health' | 'smart' | 'status'
 * - strategy: 'fast' | 'full' | 'repair' | 'smart'
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'health': {
        console.log(`[STORAGE-API] Running health check for user ${user.id}`)
        const healthReport = await checkStorageHealth(user.id)
        
        return NextResponse.json({
          action: 'health',
          timestamp: new Date().toISOString(),
          userId: user.id,
          health: healthReport
        })
      }

      case 'smart': {
        console.log(`[STORAGE-API] Running smart sync analysis for user ${user.id}`)
        
        // Get current database video count
        const dbVideoCount = await prisma.video.count({
          where: { userId: user.id }
        })

        const smartSyncResult = await smartSync(user.id, dbVideoCount)
        
        return NextResponse.json({
          action: 'smart',
          timestamp: new Date().toISOString(),
          userId: user.id,
          analysis: smartSyncResult,
          dbVideoCount
        })
      }

      case 'status':
      default: {
        console.log(`[STORAGE-API] Getting sync status for user ${user.id}`)
        
        // Get basic counts
        const dbVideoCount = await prisma.video.count({
          where: { userId: user.id }
        })

        const dbTotalSize = await prisma.video.aggregate({
          where: { userId: user.id },
          _sum: { fileSize: true }
        })

        // Get recent sync activity (if we were tracking sync history)
        const recentVideos = await prisma.video.findMany({
          where: { userId: user.id },
          orderBy: { uploadedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            uploadedAt: true,
            fileSize: true,
            storageKey: true
          }
        })

        return NextResponse.json({
          action: 'status',
          timestamp: new Date().toISOString(),
          userId: user.id,
          database: {
            videoCount: dbVideoCount,
            totalSize: dbTotalSize._sum.fileSize || 0,
            recentVideos
          },
          lastSyncedAt: null, // Could be enhanced to track sync history
          syncAvailable: true
        })
      }
    }
  } catch (error) {
    console.error('[STORAGE-API] Error in GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/storage/sync - Perform storage sync operation
 * Body parameters:
 * - strategy: 'fast' | 'full' | 'repair' | 'smart'
 * - options: SyncOptions
 * - dryRun: boolean
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      strategy = 'smart',
      options = {},
      dryRun = false
    } = body as {
      strategy?: 'fast' | 'full' | 'repair' | 'smart'
      options?: Partial<SyncOptions>
      dryRun?: boolean
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`[STORAGE-API] Starting ${strategy} sync for user ${user.id} (dryRun: ${dryRun})`)

    // Default sync options
    const syncOptions: SyncOptions = {
      cleanupOrphans: false,
      addMissing: true,
      removeOrphaned: true,
      dryRun,
      ...options
    }

    let syncResult: Record<string, unknown>
    let addedToDatabase = 0
    let removedFromDatabase = 0
    const removedFromB2 = 0
    const errors: string[] = []

    if (strategy === 'smart') {
      // Use smart sync to determine best approach
      const dbVideoCount = await prisma.video.count({
        where: { userId: user.id }
      })

      const smartSyncResult = await smartSync(user.id, dbVideoCount)
      
      if (!dryRun) {
        // Execute the recommended sync strategy
        const b2Videos = smartSyncResult.b2Videos
        const existingVideos = await prisma.video.findMany({
          where: { userId: user.id }
        })

        const existingKeys = new Set(existingVideos.map(v => v.storageKey))
        const b2Keys = new Set(b2Videos.map(v => v.key))

        // Add missing videos from B2 to database
        if (syncOptions.addMissing) {
          for (const b2Video of b2Videos) {
            if (!existingKeys.has(b2Video.key)) {
              try {
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
        }

        // Remove orphaned database records
        if (syncOptions.removeOrphaned) {
          for (const dbVideo of existingVideos) {
            if (!b2Keys.has(dbVideo.storageKey)) {
              try {
                await prisma.video.delete({
                  where: { id: dbVideo.id }
                })
                removedFromDatabase++
              } catch (error) {
                console.error(`Error removing orphaned video ${dbVideo.id}:`, error)
                errors.push(`Failed to remove orphaned record for ${dbVideo.title}`)
              }
            }
          }
        }
      }

      syncResult = {
        strategy: smartSyncResult.strategy,
        analysis: smartSyncResult,
        execution: {
          addedToDatabase,
          removedFromDatabase,
          removedFromB2,
          errors
        }
      }
    } else {
      // Use the specified strategy
      const progressCallback = (progress: SyncProgress) => {
        console.log(`[SYNC-PROGRESS] ${progress.phase}: ${progress.currentFile || 'Processing...'} (${progress.processedFiles}/${progress.totalFiles})`)
      }

      const result = await syncStorageWithProgress(user.id, {
        ...syncOptions,
        progressCallback
      })

      syncResult = {
        strategy,
        progress: result,
        execution: {
          addedToDatabase: result.addedToDatabase,
          removedFromDatabase: result.removedFromDatabase,
          removedFromB2: result.removedFromB2,
          errors: result.errors
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      userId: user.id,
      dryRun,
      sync: syncResult
    })

  } catch (error) {
    console.error('[STORAGE-API] Error in POST:', error)
    return NextResponse.json({ 
      error: 'Sync operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/storage/sync - Clear sync cache or reset sync state
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`[STORAGE-API] Clearing sync cache for user ${user.id}`)

    // This could be enhanced to clear any sync state/cache if we implement that
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      userId: user.id,
      message: 'Sync cache cleared'
    })

  } catch (error) {
    console.error('[STORAGE-API] Error in DELETE:', error)
    return NextResponse.json({ 
      error: 'Failed to clear sync cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 