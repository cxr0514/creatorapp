import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { EXPORT_FORMATS } from '@/lib/video-export';
import { smartCroppingEngine } from '@/lib/smart-cropping-engine';
import { getPresignedUrl } from '@/lib/b2';

export interface BatchExportResponse {
  success: boolean;
  queueId: string;
  totalClips: number;
  totalFormats: number;
  estimatedProcessingTime: number;
  results: Array<{
    clipId: number;
    format: string;
    platform: string;
    status: 'success' | 'failed';
    exportUrl?: string;
    storageKey?: string;
    error?: string;
    smartCropAnalysis?: {
      strategy: string;
      confidence: number;
      reasoning: string;
    };
    processingTime?: number;
  }>;
}

export async function POST(request: NextRequest): Promise<NextResponse<BatchExportResponse | { error: string }>> {
  const queueId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API/BATCH-EXPORT] Starting batch export ${queueId}`);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log(`[API/BATCH-EXPORT] Unauthorized request for batch export ${queueId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      clipIds, 
      formats, 
      platforms = [], 
      useSmartCropping = true, 
      croppingStrategy = 'auto',
      qualityLevel = 'high'
    } = body;

    console.log(`[API/BATCH-EXPORT] Batch export ${queueId} request:`, {
      clipIds: clipIds?.length || 0,
      formats: formats?.length || 0,
      platforms: platforms?.length || 0,
      useSmartCropping,
      croppingStrategy,
      qualityLevel
    });

    // Validate request
    if (!Array.isArray(clipIds) || clipIds.length === 0) {
      console.log(`[API/BATCH-EXPORT] Invalid clip IDs for batch export ${queueId}`);
      return NextResponse.json({ error: 'clipIds array is required and cannot be empty' }, { status: 400 });
    }

    if (!Array.isArray(formats) || formats.length === 0) {
      console.log(`[API/BATCH-EXPORT] Invalid formats for batch export ${queueId}`);
      return NextResponse.json({ error: 'formats array is required and cannot be empty' }, { status: 400 });
    }

    // Validate all formats exist
    const availableFormats = EXPORT_FORMATS.map(f => f.format);
    const invalidFormats = formats.filter(format => !availableFormats.includes(format));
    if (invalidFormats.length > 0) {
      console.log(`[API/BATCH-EXPORT] Invalid formats for batch export ${queueId}:`, invalidFormats);
      return NextResponse.json({ 
        error: `Invalid formats: ${invalidFormats.join(', ')}. Available formats: ${availableFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Get clips
    const clips = await prisma.clip.findMany({
      where: {
        id: { in: clipIds },
        userId: session.user.id
      },
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

    if (clips.length === 0) {
      console.log(`[API/BATCH-EXPORT] No clips found for batch export ${queueId}`);
      return NextResponse.json({ error: 'No clips found' }, { status: 404 });
    }

    console.log(`[API/BATCH-EXPORT] Processing ${clips.length} clips for batch export ${queueId}`);

    const results = [];

    // Process each clip-format combination
    for (const clip of clips) {
      if (!clip.storageKey) {
        console.warn(`[API/BATCH-EXPORT] Skipping clip ${clip.id} - no storage key`);
        continue;
      }

      // Pre-analyze content if smart cropping is enabled
      let contentAnalysis = null;
      if (useSmartCropping && croppingStrategy === 'smart') {
        try {
          contentAnalysis = await smartCroppingEngine.analyzeContent();
          console.log(`[API/BATCH-EXPORT] Content analysis completed for clip ${clip.id}`);
        } catch (error) {
          console.warn(`[API/BATCH-EXPORT] Content analysis failed for clip ${clip.id}:`, error);
        }
      }

      for (const formatKey of formats) {
        const format = EXPORT_FORMATS.find(f => f.format === formatKey);
        if (!format) {
          console.warn(`[API/BATCH-EXPORT] Skipping unknown format ${formatKey} for clip ${clip.id}`);
          continue;
        }

        const targetPlatforms = platforms.length > 0 ? platforms : format.platforms;

        for (const platform of targetPlatforms) {
          const exportStartTime = Date.now();
          console.log(`[API/BATCH-EXPORT] Processing clip ${clip.id}, format ${formatKey}, platform ${platform}`);

          try {
            let smartCropAnalysis = null;
            
            if (contentAnalysis && useSmartCropping) {
              try {
                smartCropAnalysis = await smartCroppingEngine.determineCroppingStrategy(
                  clip.aspectRatio || '16:9',
                  format,
                  contentAnalysis
                );
              } catch (error) {
                console.warn(`[API/BATCH-EXPORT] Smart crop analysis failed for clip ${clip.id}:`, error);
              }
            }

            const finalCroppingStrategy = smartCropAnalysis?.strategy || croppingStrategy || 'center';

            // For now, just return presigned URL to original video
            // In full implementation, this would apply transformations
            const transformedUrl = await getPresignedUrl(clip.storageKey);

            // Generate unique storage key for export (using user folder structure)
            const timestamp = Date.now();
            const safePlatform = platform.replace(/[^a-zA-Z0-9_]/g, '_');
            const exportStorageKey = `users/${session.user.id}/clips/exports/${clip.id}/${formatKey}_${safePlatform}_${timestamp}.mp4`;

            // Create ClipExport record
            await prisma.clipExport.create({
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
              platform: platform,
              status: 'success' as const,
              exportUrl: transformedUrl,
              storageKey: exportStorageKey,
              smartCropAnalysis: smartCropAnalysis ? {
                strategy: smartCropAnalysis.strategy,
                confidence: smartCropAnalysis.confidence,
                reasoning: smartCropAnalysis.reasoning
              } : undefined,
              processingTime
            });

            console.log(`[API/BATCH-EXPORT] Successfully exported clip ${clip.id} to ${formatKey} for ${platform} (${processingTime}ms)`);

          } catch (formatError) {
            const processingTime = Date.now() - exportStartTime;
            const errorMessage = formatError instanceof Error ? formatError.message : 'B2 processing failed';
            
            console.error(`[API/BATCH-EXPORT] Export failed for clip ${clip.id}, format ${formatKey}, platform ${platform}:`, formatError);

            results.push({
              clipId: clip.id,
              format: formatKey,
              platform: platform,
              status: 'failed' as const,
              error: errorMessage,
              processingTime
            });
          }
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    console.log(`[API/BATCH-EXPORT] Completed batch export ${queueId}. Total: ${results.length}, Success: ${successCount}, Failed: ${failureCount}`);

    return NextResponse.json({
      success: true,
      queueId,
      totalClips: clips.length,
      totalFormats: results.length,
      estimatedProcessingTime: 0, // Would be calculated based on queue
      results
    });

  } catch (error) {
    console.error(`[API/BATCH-EXPORT] Unexpected error in batch export ${queueId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error during batch export' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get('queueId');

    if (queueId) {
      // Get specific batch export status
      // This would require implementing batch export tracking in the database
      return NextResponse.json({ 
        error: 'Queue status tracking not implemented yet' 
      }, { status: 501 });
    }

    // Return available export options
    return NextResponse.json({
      formats: EXPORT_FORMATS,
      strategies: [
        { type: 'smart', name: 'Smart AI Cropping', description: 'AI-powered content analysis' },
        { type: 'face', name: 'Face Detection', description: 'Focus on detected faces' },
        { type: 'motion-tracking', name: 'Motion Tracking', description: 'Follow motion in video' },
        { type: 'center', name: 'Center Crop', description: 'Crop from center' },
        { type: 'auto', name: 'Auto Gravity', description: 'Automatic content detection' }
      ],
      qualityLevels: [
        { level: 'standard', name: 'Standard Quality', description: 'Good for social media' },
        { level: 'high', name: 'High Quality', description: 'Recommended for most uses' },
        { level: 'ultra', name: 'Ultra Quality', description: 'Best quality, larger files' }
      ]
    });

  } catch (error) {
    console.error('Batch export GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
