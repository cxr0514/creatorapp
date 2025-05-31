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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clipId, formats, croppingStrategy } = body;

    if (!clipId || !formats || !Array.isArray(formats)) {
      return NextResponse.json(
        { error: 'Missing required fields: clipId, formats' },
        { status: 400 }
      );
    }

    // Get the clip with user verification
    const clip = await prisma.clip.findFirst({
      where: {
        id: clipId,
        user: { email: session.user.email }
      },
      include: {
        video: true,
        exports: true
      }
    });

    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const results = [];
    const errors = [];

    for (const formatRequest of formats) {
      try {
        const { format, platform } = formatRequest;
        
        // Find the export format configuration
        const exportFormat = EXPORT_FORMATS.find(f => f.format === format);
        if (!exportFormat) {
          errors.push(`Unsupported format: ${format}`);
          continue;
        }

        // Check if this export already exists
        const existingExport = clip.exports.find(
          exp => exp.format === format && exp.platform === platform
        );
        
        if (existingExport) {
          results.push({
            format,
            platform,
            status: 'exists',
            exportId: existingExport.id,
            url: existingExport.cloudinaryUrl,
            message: 'Export already exists'
          });
          continue;
        }

        // Determine cropping strategy
        const cropSettings = determineCropStrategy(
          clip.aspectRatio,
          exportFormat,
          true, // AI enabled
          croppingStrategy // Use preferred strategy from request
        );

        // Generate Cloudinary transformation
        const transformation = generateCloudinaryTransformation(
          exportFormat,
          cropSettings,
          clip.startTime || undefined,
          clip.endTime || undefined
        );

        // Calculate video duration for processing estimate
        const duration = (clip.endTime || 0) - (clip.startTime || 0);
        const estimatedTime = estimateProcessingTime(duration, exportFormat);

        // Generate unique public_id for the export
        const exportPublicId = `creator_uploads/clips/${session.user.email}/${clip.id}_${format}_${platform}_${Date.now()}`;

        // Create the export using Cloudinary's video transformation
        const cloudinaryResult = await cloudinary.uploader.upload(clip.cloudinaryUrl, {
          transformation: transformation,
          public_id: exportPublicId,
          resource_type: 'video'
        });

        // Generate thumbnail for the export
        const thumbnailUrl = cloudinary.url(exportPublicId, {
          resource_type: 'video',
          transformation: [
            { width: 400, height: 300, crop: 'fill', quality: 'auto' },
            { format: 'jpg' }
          ]
        });

        // Save export record to database
        const newExport = await prisma.clipExport.create({
          data: {
            clipId: clip.id,
            format,
            platform,
            cloudinaryId: exportPublicId,
            cloudinaryUrl: cloudinaryResult.secure_url,
            croppingType: cropSettings.type,
            thumbnailUrl,
            fileSize: null // Will be updated when processing completes
          }
        });

        results.push({
          format,
          platform,
          status: 'created',
          exportId: newExport.id,
          url: newExport.cloudinaryUrl,
          thumbnailUrl: newExport.thumbnailUrl,
          estimatedProcessingTime: estimatedTime,
          croppingType: cropSettings.type,
          message: 'Export created successfully'
        });

      } catch (formatError: unknown) {
        console.error(`Error processing format ${formatRequest.format}:`, formatError);
        const errorMessage = formatError instanceof Error ? formatError.message : 'Unknown error';
        errors.push(`Failed to process ${formatRequest.format}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
      clipId,
      totalExports: results.filter(r => r.status === 'created').length
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
