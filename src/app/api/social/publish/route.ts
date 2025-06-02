import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getPlatformPublisher } from '@/lib/platform-publishers'
// import { prisma } from '@/lib/prisma' // TODO: Uncomment when database is ready

// POST /api/social/publish - Publish content immediately to social platforms
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      clipId,
      platforms,
      title,
      description,
      hashtags,
      videoUrl,
      thumbnailUrl,
      aspectRatio,
      platformSettings
    } = await request.json()

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 }
      )
    }

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: 'Title and video URL are required' },
        { status: 400 }
      )
    }

    const results = []

    // Publish to each platform
    for (const platform of platforms) {
      try {
        // TODO: Get access token from database when available
        /*
        const socialAccount = await prisma.socialAccount.findUnique({
          where: {
            userId_platform: {
              userId: session.user.id,
              platform
            }
          }
        })

        if (!socialAccount || !socialAccount.isActive) {
          results.push({
            platform,
            success: false,
            error: `No active ${platform} account connected`
          })
          continue
        }

        const accessToken = decrypt(socialAccount.accessToken)
        */

        // Mock access token for testing
        const accessToken = 'mock_access_token_for_' + platform

        const publisher = getPlatformPublisher(platform)

        // Validate content for this platform
        const isValid = await publisher.validateContent({
          title,
          description,
          hashtags,
          videoUrl,
          thumbnailUrl,
          aspectRatio,
          platform,
          accessToken,
          platformSettings: platformSettings?.[platform]
        })

        if (!isValid) {
          results.push({
            platform,
            success: false,
            error: `Content validation failed for ${platform}`
          })
          continue
        }

        // Publish the content
        const publishResult = await publisher.publish({
          title,
          description,
          hashtags,
          videoUrl,
          thumbnailUrl,
          aspectRatio,
          platform,
          accessToken,
          platformSettings: platformSettings?.[platform]
        })

        results.push({
          platform,
          success: publishResult.success,
          platformPostId: publishResult.platformPostId,
          platformUrl: publishResult.platformUrl,
          error: publishResult.error
        })

        // TODO: Save published post to database when available
        /*
        if (publishResult.success) {
          await prisma.scheduledPost.create({
            data: {
              userId: session.user.id,
              clipId,
              platform,
              title,
              description,
              hashtags,
              status: 'published',
              publishedAt: new Date(),
              platformPostId: publishResult.platformPostId,
              platformUrl: publishResult.platformUrl,
              scheduledFor: new Date() // Published immediately
            }
          })
        }
        */

      } catch (error) {
        console.error(`Error publishing to ${platform}:`, error)
        results.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : `Publishing to ${platform} failed`
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      },
      publishedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in publish API:', error)
    return NextResponse.json(
      { error: 'Failed to publish content' },
      { status: 500 }
    )
  }
}

// GET /api/social/publish/validate - Validate content for platforms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const duration = parseInt(searchParams.get('duration') || '0')
    const aspectRatio = searchParams.get('aspectRatio') || '16:9'
    const title = searchParams.get('title') || ''
    const description = searchParams.get('description') || ''

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    try {
      const publisher = getPlatformPublisher(platform)
      
      const validation = {
        platform,
        maxDuration: publisher.getMaxDuration(),
        supportedAspectRatios: publisher.getSupportedAspectRatios(),
        isValidDuration: duration <= publisher.getMaxDuration(),
        isValidAspectRatio: publisher.getSupportedAspectRatios().includes(aspectRatio),
        isValidContent: await publisher.validateContent({
          title,
          description,
          hashtags: [],
          videoUrl: 'mock://url',
          aspectRatio,
          platform,
          accessToken: 'mock'
        })
      }

      return NextResponse.json({ validation })
    } catch (error) {
      return NextResponse.json(
        { error: `Platform ${platform} not supported` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error validating content:', error)
    return NextResponse.json(
      { error: 'Failed to validate content' },
      { status: 500 }
    )
  }
}
