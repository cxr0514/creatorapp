import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { 
  EXPORT_FORMATS, 
  determineCropStrategy, 
  generateCloudinaryTransformation,
  estimateProcessingTime 
} from '@/lib/video-export';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ExportFormatRequest {
  format: '16:9' | '9:16' | '1:1' | '4:3'; // This is effectively the aspect ratio
  platform: string; // For context, e.g., 'YouTube', 'TikTok'
}

interface ExportRequestBody {
  formats: ExportFormatRequest[];
  croppingStrategy?: 'face' | 'auto' | 'center'; 
}

interface ExportResult {
  format: string;
  platform: string;
  status: 'success' | 'error' | 'exists'; // Added 'exists' for future use
  exportUrl?: string;
  newPublicId?: string;
  errorMessage?: string;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const results: ExportResult[] = [];
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // Note: No console.error here as it's an expected client error path
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clipId = parseInt(params.id);
    if (isNaN(clipId)) {
      return NextResponse.json({ error: 'Invalid clip ID' }, { status: 400 });
    }

    const body: ExportRequestBody = await request.json();
    // Ensure croppingStrategy has a default if not provided
    const { formats, croppingStrategy = 'auto' } = body;

    if (!Array.isArray(formats) || formats.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty formats array' }, { status: 400 });
    }

    const clip = await prisma.clip.findFirst({
      where: {
        id: clipId,
        userId: session.user.id, 
      },
    });

    if (!clip || !clip.cloudinaryId) {
      return NextResponse.json({ error: 'Clip not found or has no Cloudinary ID' }, { status: 404 });
    }
    
    const originalPublicId = clip.cloudinaryId;
    // Determine the base folder from the original clip's public ID
    const baseFolder = originalPublicId.includes('/') ? originalPublicId.substring(0, originalPublicId.lastIndexOf('/')) : '';

    for (const formatRequest of formats) {
      const { format: aspectRatio, platform } = formatRequest; 

      if (!aspectRatio || !['16:9', '9:16', '1:1', '4:3'].includes(aspectRatio)) {
        results.push({
          format: aspectRatio,
          platform,
          status: 'error',
          errorMessage: `Invalid aspect ratio: ${aspectRatio}`,
        });
        continue; // Skip to next format
      }
      
      let transformation: any = {
        aspect_ratio: aspectRatio.replace(':', '_'),
        crop: 'fill', 
        gravity: croppingStrategy,
      };

      if (aspectRatio === '9:16') {
        transformation.width = 1080;
        // transformation.height = 1920; // Height is often implied by aspect ratio and width + crop mode
      } else if (aspectRatio === '1:1') {
        transformation.width = 1080;
        // transformation.height = 1080;
      } else if (aspectRatio === '16:9') {
        transformation.width = 1920;
        // transformation.height = 1080;
      }
      // Add other aspect ratios or more sophisticated dimension logic as needed

      const transformedUrl = cloudinary.url(originalPublicId, {
        resource_type: 'video',
        transformation: [transformation, { fetch_format: 'mp4' }],
      });
      
      // Sanitize platform and aspect ratio for use in public_id
      const safePlatform = platform.replace(/[^a-zA-Z0-9_]/g, '_');
      const safeAspectRatio = aspectRatio.replace(':', '_');
      const newExportSuffix = `export_${safeAspectRatio}_${croppingStrategy}_${safePlatform}`;
      const newPublicId = `${originalPublicId}_${newExportSuffix}`;

      try {
        console.log(`[API/CLIPS EXPORT] Processing for clip ${clipId}: format ${aspectRatio}, platform ${platform}, strategy ${croppingStrategy}`);
        console.log(`[API/CLIPS EXPORT] Original Public ID: ${originalPublicId}`);
        console.log(`[API/CLIPS EXPORT] Transformation: ${JSON.stringify(transformation)}`);
        console.log(`[API/CLIPS EXPORT] Transformed URL for upload: ${transformedUrl}`);
        console.log(`[API/CLIPS EXPORT] New Public ID for export: ${newPublicId}`);
        console.log(`[API/CLIPS EXPORT] Target Folder for export: ${baseFolder}`);

        const uploadResult = await cloudinary.uploader.upload(transformedUrl, {
          public_id: newPublicId,
          folder: baseFolder, 
          resource_type: 'video',
          context: { 
            exported_from_clip_id: clip.id.toString(),
            original_public_id: originalPublicId,
            export_aspect_ratio: aspectRatio,
            export_platform: platform,
            cropping_strategy: croppingStrategy,
          }
        });

        console.log(`[API/CLIPS EXPORT] Successfully exported ${newPublicId}: ${uploadResult.secure_url}`);
        results.push({
          format: aspectRatio,
          platform,
          status: 'success',
          exportUrl: uploadResult.secure_url,
          newPublicId: uploadResult.public_id,
        });

      } catch (uploadError: any) {
        console.error(`[API/CLIPS EXPORT] Error exporting format ${aspectRatio} for platform ${platform} (Clip ID: ${clipId}):`, uploadError);
        results.push({
          format: aspectRatio,
          platform,
          status: 'error',
          errorMessage: uploadError.message || 'Cloudinary upload failed',
        });
      }
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('[API/CLIPS EXPORT] General error in export handler:', error);
    // Ensure a generic error is returned if specific results cannot be formed
    return NextResponse.json({ 
        error: error.message || 'Internal server error', 
        results // Include any partial results if available
    }, { status: 500 });
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
