// Video export and smart cropping utilities

export interface ExportFormat {
  format: string;
  aspectRatio: string;
  width: number;
  height: number;
  platforms: string[];
  displayName: string;
  description: string;
}

export interface CropSettings {
  type: 'center' | 'face' | 'action' | 'smart';
  gravity?: string;
  zoom?: number;
  x?: number;
  y?: number;
}

// Supported export formats based on PRD requirements
export const EXPORT_FORMATS: ExportFormat[] = [
  {
    format: '9:16',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    platforms: ['tiktok', 'instagram-reels', 'youtube-shorts'],
    displayName: 'Vertical (9:16)',
    description: 'Perfect for TikTok, Instagram Reels, YouTube Shorts'
  },
  {
    format: '1:1',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    platforms: ['instagram-posts', 'twitter', 'linkedin'],
    displayName: 'Square (1:1)',
    description: 'Ideal for Instagram Posts, Twitter, LinkedIn'
  },
  {
    format: '16:9',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    platforms: ['youtube', 'twitter', 'linkedin', 'general'],
    displayName: 'Landscape (16:9)',
    description: 'Standard for YouTube, Twitter, LinkedIn, General Web'
  },
  {
    format: '4:3',
    aspectRatio: '4:3',
    width: 1440,
    height: 1080,
    platforms: ['general'],
    displayName: 'Traditional (4:3)',
    description: 'Classic aspect ratio for general content'
  }
];

// Platform-specific optimization settings
export const PLATFORM_SETTINGS = {
  'tiktok': {
    maxDuration: 180, // 3 minutes
    recommendedDuration: 60,
    audioRequired: true,
    captionsRecommended: true
  },
  'instagram-reels': {
    maxDuration: 90,
    recommendedDuration: 30,
    audioRequired: true,
    captionsRecommended: true
  },
  'youtube-shorts': {
    maxDuration: 60,
    recommendedDuration: 45,
    audioRequired: false,
    captionsRecommended: true
  },
  'instagram-posts': {
    maxDuration: 60,
    recommendedDuration: 30,
    audioRequired: false,
    captionsRecommended: false
  },
  'twitter': {
    maxDuration: 140,
    recommendedDuration: 45,
    audioRequired: false,
    captionsRecommended: false
  },
  'linkedin': {
    maxDuration: 600, // 10 minutes
    recommendedDuration: 120,
    audioRequired: false,
    captionsRecommended: true
  },
  'youtube': {
    maxDuration: null, // No limit
    recommendedDuration: 300,
    audioRequired: false,
    captionsRecommended: true
  }
};

/**
 * Determines the best cropping strategy based on the source and target aspect ratios
 */
export function determineCropStrategy(
  sourceAspectRatio: string,
  targetFormat: ExportFormat,
  hasAI: boolean = true
): CropSettings {
  const sourceRatio = parseAspectRatio(sourceAspectRatio);
  const targetRatio = targetFormat.width / targetFormat.height;

  // If the source matches target, no cropping needed
  if (Math.abs(sourceRatio - targetRatio) < 0.01) {
    return { type: 'center' };
  }

  // For vertical content (9:16) from horizontal source
  if (targetFormat.format === '9:16' && sourceRatio > 1) {
    return hasAI ? { type: 'smart', gravity: 'face' } : { type: 'center' };
  }

  // For horizontal content from vertical source
  if (targetFormat.format === '16:9' && sourceRatio < 1) {
    return hasAI ? { type: 'smart', gravity: 'center' } : { type: 'center' };
  }

  // For square content
  if (targetFormat.format === '1:1') {
    return hasAI ? { type: 'smart', gravity: 'face' } : { type: 'center' };
  }

  // Default to center cropping
  return { type: 'center' };
}

/**
 * Converts aspect ratio string to numeric ratio
 */
function parseAspectRatio(aspectRatio: string): number {
  const [width, height] = aspectRatio.split(':').map(Number);
  return width / height;
}

/**
 * Generates Cloudinary transformation parameters for smart cropping
 */
export function generateCloudinaryTransformation(
  format: ExportFormat,
  cropSettings: CropSettings,
  startTime?: number,
  endTime?: number
): string {
  const transformations: string[] = [];

  // Video trimming if start/end times are provided
  if (startTime !== undefined && endTime !== undefined) {
    const duration = endTime - startTime;
    transformations.push(`so_${startTime}`);
    transformations.push(`du_${duration}`);
  }

  // Resize and crop transformations
  transformations.push(`w_${format.width}`);
  transformations.push(`h_${format.height}`);
  transformations.push('c_fill');

  // Apply smart cropping based on settings
  switch (cropSettings.type) {
    case 'face':
      transformations.push('g_face');
      break;
    case 'action':
      transformations.push('g_auto');
      break;
    case 'smart':
      transformations.push('g_auto:subject');
      break;
    default:
      transformations.push('g_center');
  }

  // Quality and format optimizations
  transformations.push('q_auto');
  transformations.push('f_mp4');

  return transformations.join(',');
}

/**
 * Gets platform recommendations for a given format
 */
export function getPlatformRecommendations(format: ExportFormat): string[] {
  return format.platforms.map(platform => {
    const settings = PLATFORM_SETTINGS[platform as keyof typeof PLATFORM_SETTINGS];
    if (!settings) return platform;

    const recommendations = [];
    if (settings.recommendedDuration) {
      recommendations.push(`${settings.recommendedDuration}s ideal`);
    }
    if (settings.captionsRecommended) {
      recommendations.push('captions recommended');
    }
    if (settings.audioRequired) {
      recommendations.push('audio required');
    }

    return recommendations.length > 0 
      ? `${platform} (${recommendations.join(', ')})`
      : platform;
  });
}

/**
 * Estimates processing time based on video duration and format complexity
 */
export function estimateProcessingTime(durationSeconds: number, format: ExportFormat): number {
  // Base processing time (seconds per video second)
  let processingRatio = 0.5;

  // Smart cropping adds processing time
  if (format.format !== '16:9') {
    processingRatio += 0.2;
  }

  // Higher resolutions take longer
  const pixels = format.width * format.height;
  if (pixels > 1920 * 1080) {
    processingRatio += 0.3;
  }

  return Math.ceil(durationSeconds * processingRatio);
}
