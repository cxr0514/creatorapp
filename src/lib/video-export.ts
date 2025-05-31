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
  type: 'center' | 'face' | 'action' | 'smart' | 'rule-of-thirds' | 'motion-tracking' | 'auto-focus';
  gravity?: string;
  zoom?: number;
  x?: number;
  y?: number;
  confidence?: number; // AI detection confidence threshold
  fallback?: 'center' | 'face' | 'smart'; // Fallback strategy if primary fails
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
  hasAI: boolean = true,
  preferredStrategy?: string
): CropSettings {
  const sourceRatio = parseAspectRatio(sourceAspectRatio);
  const targetRatio = targetFormat.width / targetFormat.height;

  // If the source matches target, no cropping needed
  if (Math.abs(sourceRatio - targetRatio) < 0.01) {
    return { type: 'center' };
  }

  // Use preferred strategy if specified
  if (preferredStrategy && hasAI) {
    const validStrategies: CropSettings['type'][] = ['face', 'action', 'smart', 'rule-of-thirds', 'motion-tracking', 'auto-focus'];
    if (validStrategies.includes(preferredStrategy as CropSettings['type'])) {
      return {
        type: preferredStrategy as CropSettings['type'],
        confidence: 0.7,
        fallback: 'center'
      };
    }
  }

  // For vertical content (9:16) from horizontal source - prioritize face detection
  if (targetFormat.format === '9:16' && sourceRatio > 1) {
    return hasAI ? { 
      type: 'face', 
      confidence: 0.6,
      fallback: 'smart'
    } : { type: 'center' };
  }

  // For horizontal content from vertical source - use motion tracking
  if (targetFormat.format === '16:9' && sourceRatio < 1) {
    return hasAI ? { 
      type: 'motion-tracking',
      confidence: 0.5,
      fallback: 'center'
    } : { type: 'center' };
  }

  // For square content - prioritize face detection with smart fallback
  if (targetFormat.format === '1:1') {
    return hasAI ? { 
      type: 'face',
      confidence: 0.6,
      fallback: 'smart'
    } : { type: 'center' };
  }

  // Default to smart cropping with center fallback
  return hasAI ? {
    type: 'auto-focus',
    confidence: 0.5,
    fallback: 'center'
  } : { type: 'center' };
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
    case 'rule-of-thirds':
      transformations.push('g_auto:composition');
      break;
    case 'motion-tracking':
      transformations.push('g_auto:motion');
      break;
    case 'auto-focus':
      transformations.push('g_auto:focus');
      break;
    default:
      transformations.push('g_center');
  }

  // Add confidence threshold for AI-based cropping
  if (cropSettings.confidence && ['face', 'action', 'smart', 'rule-of-thirds', 'motion-tracking', 'auto-focus'].includes(cropSettings.type)) {
    transformations.push(`q_auto:${Math.round(cropSettings.confidence * 100)}`);
  } else {
    transformations.push('q_auto');
  }

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

export interface BatchExportRequest {
  clipIds: number[];
  formats: ExportFormat[];
  platforms: string[];
  croppingStrategy?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface ExportQueueItem {
  id: string;
  clipId: number;
  format: string;
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  croppingType: string;
  estimatedTime: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: {
    url: string;
    size: number;
    duration: number;
    metadata?: Record<string, unknown>;
  }; // Export result data when completed
}

export interface CroppingStrategyInfo {
  type: string;
  displayName: string;
  description: string;
  bestFor: string[];
  aiRequired: boolean;
}

// Available cropping strategies with descriptions
export const CROPPING_STRATEGIES: CroppingStrategyInfo[] = [
  {
    type: 'face',
    displayName: 'Face Detection',
    description: 'Automatically detects and centers on faces in the video',
    bestFor: ['portraits', 'interviews', 'talking heads', 'social content'],
    aiRequired: true
  },
  {
    type: 'action',
    displayName: 'Action Tracking',
    description: 'Follows movement and action in the video',
    bestFor: ['sports', 'fitness', 'tutorials', 'demonstrations'],
    aiRequired: true
  },
  {
    type: 'smart',
    displayName: 'Smart Subject',
    description: 'AI identifies the main subject and keeps it in frame',
    bestFor: ['general content', 'product demos', 'presentations'],
    aiRequired: true
  },
  {
    type: 'rule-of-thirds',
    displayName: 'Rule of Thirds',
    description: 'Uses composition principles for visually appealing crops',
    bestFor: ['cinematic content', 'landscapes', 'artistic videos'],
    aiRequired: true
  },
  {
    type: 'motion-tracking',
    displayName: 'Motion Tracking',
    description: 'Tracks and follows motion throughout the video',
    bestFor: ['dynamic content', 'moving subjects', 'sports'],
    aiRequired: true
  },
  {
    type: 'auto-focus',
    displayName: 'Auto Focus',
    description: 'Automatically finds and focuses on the most important area',
    bestFor: ['mixed content', 'unknown content type'],
    aiRequired: true
  },
  {
    type: 'center',
    displayName: 'Center Crop',
    description: 'Simple center-based cropping (fallback option)',
    bestFor: ['symmetric content', 'when AI fails'],
    aiRequired: false
  }
];

/**
 * Gets the appropriate cropping strategy info
 */
export function getCroppingStrategyInfo(type: string): CroppingStrategyInfo | null {
  return CROPPING_STRATEGIES.find(strategy => strategy.type === type) || null;
}

/**
 * Validates if a cropping strategy is available
 */
export function isCroppingStrategyAvailable(type: string, hasAI: boolean): boolean {
  const strategy = getCroppingStrategyInfo(type);
  if (!strategy) return false;
  return !strategy.aiRequired || hasAI;
}

/**
 * Generates a batch export queue from a batch request
 */
export function generateBatchExportQueue(request: BatchExportRequest): ExportQueueItem[] {
  const queue: ExportQueueItem[] = [];
  
  request.clipIds.forEach(clipId => {
    request.formats.forEach(format => {
      request.platforms.forEach(platform => {
        // Only include platform if it's supported by the format
        if (format.platforms.includes(platform)) {
          const estimatedTime = estimateProcessingTime(30, format); // Default 30s estimate
          
          queue.push({
            id: `${clipId}_${format.format}_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            clipId,
            format: format.format,
            platform,
            status: 'pending',
            progress: 0,
            croppingType: request.croppingStrategy || 'smart',
            estimatedTime,
          });
        }
      });
    });
  });
  
  // Sort by priority and estimated time
  return queue.sort((a, b) => {
    const priorityWeight = request.priority === 'high' ? -100 : request.priority === 'low' ? 100 : 0;
    return (a.estimatedTime + priorityWeight) - (b.estimatedTime + priorityWeight);
  });
}

/**
 * Estimates total batch processing time
 */
export function estimateBatchProcessingTime(queue: ExportQueueItem[]): {
  totalTime: number;
  averagePerItem: number;
  itemCount: number;
} {
  const totalTime = queue.reduce((sum, item) => sum + item.estimatedTime, 0);
  return {
    totalTime,
    averagePerItem: queue.length > 0 ? totalTime / queue.length : 0,
    itemCount: queue.length
  };
}

/**
 * Gets recommended cropping strategy based on content type and target format
 */
export function getRecommendedCroppingStrategy(
  contentType: 'portrait' | 'landscape' | 'action' | 'presentation' | 'general',
  targetFormat: ExportFormat,
  hasAI: boolean = true
): string {
  if (!hasAI) return 'center';
  
  const recommendations = {
    'portrait': {
      '9:16': 'face',
      '1:1': 'face',
      '16:9': 'smart',
      '4:3': 'smart'
    },
    'landscape': {
      '9:16': 'rule-of-thirds',
      '1:1': 'rule-of-thirds',
      '16:9': 'center',
      '4:3': 'center'
    },
    'action': {
      '9:16': 'motion-tracking',
      '1:1': 'action',
      '16:9': 'action',
      '4:3': 'action'
    },
    'presentation': {
      '9:16': 'smart',
      '1:1': 'smart',
      '16:9': 'center',
      '4:3': 'center'
    },
    'general': {
      '9:16': 'auto-focus',
      '1:1': 'smart',
      '16:9': 'smart',
      '4:3': 'smart'
    }
  };
  
  return recommendations[contentType][targetFormat.format as keyof typeof recommendations[typeof contentType]] || 'smart';
}
