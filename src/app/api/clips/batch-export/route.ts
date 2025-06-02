import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { EXPORT_FORMATS, type BatchExportRequest } from '@/lib/video-export';
import { smartCroppingEngine } from '@/lib/smart-cropping-engine';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface BatchExportResult {
  clipId: number;
  format: string;
  platform: string;
  status: 'success' | 'error';
  exportUrl?: string;
  newPublicId?: string;
  errorMessage?: string;
  smartCropAnalysis?: {
    strategy: string;
    confidence: number;
    reasoning: string;
  };
  processingTime?: number;
}

interface BatchExportResponse {
  results: BatchExportResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalProcessingTime: number;
  };
  queueId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<BatchExportResponse | { error: string }>> {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BatchExportRequest = await request.json();
    const { 
      clipIds, 
      formats, 
      platforms = [], 
      croppingStrategy = 'smart',
      useSmartCropping = true,
      qualityLevel = 'high'
    } = body;

    if (!Array.isArray(clipIds) || clipIds.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty clipIds array' }, { status: 400 });
    }

    if (!Array.isArray(formats) || formats.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty formats array' }, { status: 400 });
    }

    // Generate unique queue ID
    const queueId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Fetch all clips
    const clips = await prisma.clip.findMany({
      where: {
        id: { in: clipIds },
        userId: session.user.id,
      },
    });

    if (clips.length === 0) {
      return NextResponse.json({ error: 'No valid clips found' }, { status: 404 });
    }

    console.log(`[API/BATCH-EXPORT] Starting batch export ${queueId} for ${clips.length} clips, ${formats.length} formats`);

    const results: BatchExportResult[] = [];

    // Process each clip-format combination
    for (const clip of clips) {
      if (!clip.cloudinaryId) {
        console.warn(`[API/BATCH-EXPORT] Skipping clip ${clip.id} - no Cloudinary ID`);
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

      for (const format of formats) {
        const targetPlatforms = platforms.length > 0 ? platforms : format.platforms;
        
        for (const platform of targetPlatforms) {
          const exportStartTime = Date.now();
          
          try {
            // Determine optimal cropping strategy
            let finalCroppingStrategy = croppingStrategy;
            let smartCropAnalysis = null;

            if (contentAnalysis && useSmartCropping && croppingStrategy === 'smart') {
              const optimalStrategy = await smartCroppingEngine.determineCroppingStrategy(
                clip.aspectRatio,
                format,
                contentAnalysis
              );
              
              smartCropAnalysis = optimalStrategy;
              
              // Map to valid strategy
              const strategyMapping: Record<string, string> = {
                'face-detection': 'face',
                'motion-tracking': 'motion-tracking',
                'center-crop': 'center',
                'auto-focus': 'auto-focus',
                'rule-of-thirds': 'rule-of-thirds',
                'action-detection': 'action'
              };
              
              finalCroppingStrategy = strategyMapping[optimalStrategy.strategy] || 'auto';
            }

            // Generate transformation
            const transformation: Record<string, string | number> = {
              aspect_ratio: format.format.replace(':', '_'),
              crop: 'fill',
              quality: qualityLevel === 'ultra' ? '100' : qualityLevel === 'high' ? 'auto:good' : 'auto:low'
            };

            // Apply smart cropping transformations if available
            let transformedUrl: string;
            if (smartCropAnalysis && useSmartCropping) {
              const cloudinaryTransformation = smartCroppingEngine.generateCloudinaryTransformation(
                smartCropAnalysis,
                format,
                clip.startTime || undefined,
                clip.endTime || undefined
              );
              transformedUrl = cloudinary.url(clip.cloudinaryId, {
                resource_type: 'video',
                transformation: cloudinaryTransformation,
              });
            } else {
              // Use basic gravity-based cropping
              transformation.gravity = finalCroppingStrategy === 'auto' ? 'auto' : finalCroppingStrategy;

              // Set width based on format and quality
              if (format.format === '9:16') {
                transformation.width = qualityLevel === 'ultra' ? 1440 : 1080;
              } else if (format.format === '1:1') {
                transformation.width = qualityLevel === 'ultra' ? 1440 : 1080;
              } else if (format.format === '16:9') {
                transformation.width = qualityLevel === 'ultra' ? 2560 : qualityLevel === 'high' ? 1920 : 1280;
              } else if (format.format === '4:3') {
                transformation.width = qualityLevel === 'ultra' ? 1920 : qualityLevel === 'high' ? 1440 : 1024;
              }

              transformedUrl = cloudinary.url(clip.cloudinaryId, {
                resource_type: 'video',
                transformation: [transformation, { fetch_format: 'mp4' }],
              });
            }

            // Generate unique public ID for export
            const baseFolder = clip.cloudinaryId.includes('/') ? 
              clip.cloudinaryId.substring(0, clip.cloudinaryId.lastIndexOf('/')) : '';
            const safePlatform = platform.replace(/[^a-zA-Z0-9_]/g, '_');
            const safeAspectRatio = format.format.replace(':', '_');
            const newExportSuffix = `export_${safeAspectRatio}_${finalCroppingStrategy}_${safePlatform}`;
            const newPublicId = `${clip.cloudinaryId}_${newExportSuffix}`;

            // Upload to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(transformedUrl, {
              public_id: newPublicId,
              folder: baseFolder,
              resource_type: 'video',
              context: {
                exported_from_clip_id: clip.id.toString(),
                original_public_id: clip.cloudinaryId,
                export_aspect_ratio: format.format,
                export_platform: platform,
                cropping_strategy: finalCroppingStrategy,
                batch_export_queue: queueId,
                quality_level: qualityLevel
              }
            });

            const processingTime = Date.now() - exportStartTime;

            results.push({
              clipId: clip.id,
              format: format.format,
              platform,
              status: 'success',
              exportUrl: uploadResult.secure_url,
              newPublicId: uploadResult.public_id,
              smartCropAnalysis: smartCropAnalysis ? {
                strategy: smartCropAnalysis.strategy,
                confidence: smartCropAnalysis.confidence,
                reasoning: smartCropAnalysis.reasoning
              } : undefined,
              processingTime
            });

            console.log(`[API/BATCH-EXPORT] Successfully exported clip ${clip.id} to ${format.format} for ${platform} (${processingTime}ms)`);

          } catch (error) {
            const processingTime = Date.now() - exportStartTime;
            
            const errorMessage = error instanceof Error ? error.message : 'Export failed';
            console.error(`[API/BATCH-EXPORT] Failed to export clip ${clip.id} to ${format.format} for ${platform}:`, error);
            
            results.push({
              clipId: clip.id,
              format: format.format,
              platform,
              status: 'error',
              errorMessage,
              processingTime
            });
          }
        }
      }
    }

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const totalTime = Date.now() - startTime;

    console.log(`[API/BATCH-EXPORT] Batch export ${queueId} completed: ${successful} successful, ${failed} failed (${totalTime}ms total)`);

    const response: BatchExportResponse = {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        totalProcessingTime: totalTime
      },
      queueId
    };

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[API/BATCH-EXPORT] General error in batch export handler:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
