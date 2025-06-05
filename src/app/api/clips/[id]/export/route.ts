import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { EXPORT_FORMATS } from '@/lib/video-export';
import { applyStyleTemplate, uploadToB2, getPresignedUrl } from '@/lib/b2';
import { smartCroppingEngine } from '@/lib/smart-cropping-engine';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const clipId = parseInt(params.id);
  
  console.log(`[API/CLIP-EXPORT] Starting export for clip ${clipId}`);
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log(`[API/CLIP-EXPORT] Unauthorized request for clip ${clipId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { 
      formats, 
      templateId, 
      platforms = [], 
      qualityLevel = 'high',
      useSmartCropping = true,
      croppingStrategy = 'auto'
    } = requestBody;

    console.log(`[API/CLIP-EXPORT] Export request for clip ${clipId}:`, {
      formats: formats?.length || 0,
      templateId,
      platforms: platforms?.length || 0,
      qualityLevel,
      useSmartCropping,
      croppingStrategy
    });

    // Validate formats
    if (!formats || !Array.isArray(formats) || formats.length === 0) {
      console.log(`[API/CLIP-EXPORT] Invalid formats for clip ${clipId}`);
      return NextResponse.json({ error: 'Formats array is required' }, { status: 400 });
    }

    // Validate all formats exist
    const availableFormats = Object.keys(EXPORT_FORMATS);
    const invalidFormats = formats.filter(format => !availableFormats.includes(format));
    if (invalidFormats.length > 0) {
      console.log(`[API/CLIP-EXPORT] Invalid formats for clip ${clipId}:`, invalidFormats);
      return NextResponse.json({ 
        error: `Invalid formats: ${invalidFormats.join(', ')}. Available formats: ${availableFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Get the clip with video data
    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      include: {
        video: {
          select: {
            storageKey: true,
            storageUrl: true,
            userId: true
          }
        }
      }
    });

    if (!clip || !clip.storageKey) {
      return NextResponse.json({ error: 'Clip not found or has no storage key' }, { status: 404 });
    }

    // Verify ownership
    if (clip.video.userId !== session.user.id) {
      console.log(`[API/CLIP-EXPORT] Access denied for clip ${clipId} by user ${session.user.id}`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log(`[API/CLIP-EXPORT] Processing clip ${clipId} with storage key: ${clip.storageKey}`);

    // Get template if specified
    let template = null;
    if (templateId) {
      template = await prisma.styleTemplate.findUnique({
        where: { id: templateId, userId: session.user.id }
      });

      if (!template) {
        console.log(`[API/CLIP-EXPORT] Template ${templateId} not found for clip ${clipId}`);
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
    }

    console.log(`[API/CLIP-EXPORT] Template loaded for clip ${clipId}:`, template?.name || 'None');

    const originalStorageKey = clip.storageKey;
    const results = [];

    console.log(`[API/CLIP-EXPORT] Starting processing of ${formats.length} formats for clip ${clipId}`);

    // Process each format
    for (const formatKey of formats) {
      const exportFormat = EXPORT_FORMATS[formatKey];
      if (!exportFormat) {
        console.warn(`[API/CLIP-EXPORT] Skipping unknown format ${formatKey} for clip ${clipId}`);
        continue;
      }

      const aspectRatio = exportFormat.aspectRatio;
      console.log(`[API/CLIP-EXPORT] Processing format ${formatKey} (${aspectRatio}) for clip ${clipId}`);

      // Determine platforms for this format
      const targetPlatforms = platforms.length > 0 ? platforms : exportFormat.platforms;

      console.log(`[API/CLIP-EXPORT] Target platforms for ${formatKey}:`, targetPlatforms);

      for (const platform of targetPlatforms) {
        const exportStartTime = Date.now();
        console.log(`[API/CLIP-EXPORT] Starting export for clip ${clipId}, format ${formatKey}, platform ${platform}`);

        try {
          // Pre-analyze content if smart cropping is enabled
          let smartCropAnalysis = null;
          if (useSmartCropping && croppingStrategy === 'smart') {
            try {
              const contentAnalysis = await smartCroppingEngine.analyzeContent();
              smartCropAnalysis = await smartCroppingEngine.determineCroppingStrategy(
                clip.aspectRatio || '16:9',
                exportFormat,
                contentAnalysis
              );
              console.log(`[API/CLIP-EXPORT] Smart crop analysis completed for clip ${clipId}`);
            } catch (error) {
              console.warn(`[API/CLIP-EXPORT] Smart crop analysis failed for clip ${clipId}:`, error);
            }
          }

          // Determine final cropping strategy
          const finalCroppingStrategy = smartCropAnalysis?.strategy || croppingStrategy || 'center';

          console.log(`[API/CLIP-EXPORT] Using cropping strategy: ${finalCroppingStrategy} for clip ${clipId}`);

          let transformedUrl: string;

          if (template) {
            // Use template transformation
            transformedUrl = await applyStyleTemplate(originalStorageKey, {
              fontFamily: template.fontFamily || undefined,
              primaryColor: template.primaryColor || undefined,
              secondaryColor: template.secondaryColor || undefined,
              backgroundColor: template.backgroundColor || undefined,
              logoStorageKey: template.logoStorageKey || undefined,
              introStorageKey: template.introStorageKey || undefined,
              outroStorageKey: template.outroStorageKey || undefined,
              lowerThirdText: template.lowerThirdText || undefined,
              lowerThirdPosition: template.lowerThirdPosition || undefined,
              callToActionText: template.callToActionText || undefined,
              callToActionUrl: template.callToActionUrl || undefined,
              callToActionPosition: template.callToActionPosition || undefined
            }, {
              aspectRatio,
              quality: 'auto'
            });
          } else {
            // For now, just return presigned URL to original video
            // In full implementation, this would apply transformations
            transformedUrl = await getPresignedUrl(originalStorageKey);
          }

          // Generate unique storage key for export
          const timestamp = Date.now();
          const safePlatform = platform.replace(/[^a-zA-Z0-9_]/g, '_');
          const safeAspectRatio = formatKey.replace(':', '_');
          const exportStorageKey = `exports/${session.user.id}/${clipId}/${formatKey}_${safePlatform}_${timestamp}.mp4`;

          // For now, we'll create a database record with the presigned URL
          // In a full implementation, you would process and re-upload the transformed video

          // Create ClipExport record
          const clipExport = await prisma.clipExport.create({
            data: {
              clipId: clip.id,
              format: formatKey,
              platform,
              storageKey: exportStorageKey,
              storageUrl: transformedUrl,
              croppingType: finalCroppingStrategy,
              fileSize: null, // Would be calculated after processing
            }
          });

          const processingTime = Date.now() - exportStartTime;

          results.push({
            clipId: clip.id,
            format: formatKey,
            platform,
            status: 'success',
            exportUrl: transformedUrl,
            storageKey: exportStorageKey,
            smartCropAnalysis: smartCropAnalysis ? {
              strategy: smartCropAnalysis.strategy,
              confidence: smartCropAnalysis.confidence,
              reasoning: smartCropAnalysis.reasoning
            } : undefined,
            processingTime
          });

          console.log(`[API/CLIP-EXPORT] Successfully exported clip ${clipId} to ${formatKey} for ${platform} (${processingTime}ms)`);

        } catch (formatError) {
          const processingTime = Date.now() - exportStartTime;
          const errorMessage = formatError instanceof Error ? formatError.message : 'B2 processing failed';
          
          console.error(`[API/CLIP-EXPORT] Export failed for clip ${clipId}, format ${formatKey}, platform ${platform}:`, formatError);

          results.push({
            clipId: clip.id,
            format: formatKey,
            platform,
            status: 'failed',
            error: errorMessage,
            processingTime
          });
        }
      }
    }

    console.log(`[API/CLIP-EXPORT] Completed export for clip ${clipId}. Results:`, results.length);

    return NextResponse.json({
      success: true,
      clipId: clip.id,
      results,
      totalResults: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      failureCount: results.filter(r => r.status === 'failed').length
    });

  } catch (error) {
    console.error(`[API/CLIP-EXPORT] Unexpected error for clip ${clipId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error during export' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clipId = searchParams.get('clipId');

    if (!clipId) {
      return NextResponse.json(
        { error: 'Missing clipId parameter' },
        { status: 400 }
      );
    }

    // Get all exports for the clip
    const exports = await prisma.clipExport.findMany({
      where: {
        clip: {
          id: parseInt(clipId),
          user: { email: session.user.email }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      exports,
      availableFormats: EXPORT_FORMATS
    });

  } catch (error) {
    console.error('Export GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
