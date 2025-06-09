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

export interface CroppingStrategyInfo {
  type: string;
  displayName: string;
  description: string;
  bestFor: string[];
  aiRequired: boolean;
}

export interface BatchExportRequest {
  videoIds: number[];
  formats: ExportFormat[];
  platforms: string[];
  croppingStrategy?: string;
  priority?: 'low' | 'normal' | 'high';
  useSmartCropping?: boolean;
  qualityLevel?: 'standard' | 'high' | 'ultra';
}

export interface ExportQueueItem {
  id: string;
  videoId: number;
  format: string;
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  croppingType: string;
  estimatedTime: number;
  retryCount?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: {
    url: string;
    size: number;
    duration: number;
    metadata?: Record<string, unknown>;
  };
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

export const CROPPING_STRATEGIES: CroppingStrategyInfo[] = [
  {
    type: 'center',
    displayName: 'Center Crop',
    description: 'Crops from the center of the video',
    bestFor: ['General content', 'Landscapes', 'Products'],
    aiRequired: false
  },
  {
    type: 'face',
    displayName: 'Face Detection',
    description: 'Focuses on detected faces in the video',
    bestFor: ['Talking heads', 'Interviews', 'Presentations'],
    aiRequired: true
  },
  {
    type: 'action',
    displayName: 'Action Tracking',
    description: 'Follows movement and action in the video',
    bestFor: ['Sports', 'Gaming', 'Dynamic content'],
    aiRequired: true
  },
  {
    type: 'smart',
    displayName: 'Smart Crop',
    description: 'AI determines the best cropping area',
    bestFor: ['Mixed content', 'Complex scenes'],
    aiRequired: true
  },
  {
    type: 'rule-of-thirds',
    displayName: 'Rule of Thirds',
    description: 'Crops based on rule of thirds composition',
    bestFor: ['Artistic content', 'Photography'],
    aiRequired: false
  },
  {
    type: 'motion-tracking',
    displayName: 'Motion Tracking',
    description: 'Tracks and follows motion in the video',
    bestFor: ['Sports', 'Action sequences'],
    aiRequired: true
  },
  {
    type: 'auto-focus',
    displayName: 'Auto Focus',
    description: 'Automatically focuses on the main subject',
    bestFor: ['Product demos', 'Tutorials'],
    aiRequired: true
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
        fallback: 'center'
      };
    }
  }

  // For vertical formats (like 9:16), prioritize face detection
  if (targetFormat.format === '9:16' && hasAI) {
    return { type: 'face', fallback: 'center' };
  }

  // For square formats, use smart cropping to find the best center
  if (targetFormat.format === '1:1' && hasAI) {
    return { type: 'smart', fallback: 'center' };
  }

  // Default to center for landscape or when AI is not available
  return { type: 'center' };
}

function parseAspectRatio(aspectRatio: string): number {
  const parts = aspectRatio.split(':');
  if (parts.length === 2) {
    return parseFloat(parts[0]) / parseFloat(parts[1]);
  }
  return 16 / 9; // Default fallback
}

export function generateVideoTransformation(
  format: ExportFormat,
  cropSettings: CropSettings,
  startTime?: number,
  endTime?: number
): {
  width: number;
  height: number;
  aspectRatio: string;
  crop: string;
  gravity: string;
  startTime?: number;
  endTime?: number;
} {
  return {
    width: format.width,
    height: format.height,
    aspectRatio: format.aspectRatio,
    crop: 'fill',
    gravity: cropSettings.type === 'smart' ? 'auto' : cropSettings.type === 'center' ? 'center' : 'auto',
    ...(startTime !== undefined && { startTime }),
    ...(endTime !== undefined && { endTime })
  };
}

export function getPlatformRecommendations(format: ExportFormat): string[] {
  const recommendations: string[] = [];

  format.platforms.forEach(platform => {
    const settings = PLATFORM_SETTINGS[platform as keyof typeof PLATFORM_SETTINGS];
    if (settings) {
      recommendations.push(`${platform}: ${settings.recommendedDuration}s recommended`);
      if (settings.audioRequired) {
        recommendations.push(`${platform}: Audio required`);
      }
      if (settings.captionsRecommended) {
        recommendations.push(`${platform}: Captions recommended`);
      }
    }
  });

  return recommendations;
}

/**
 * Estimates processing time based on video duration and format complexity
 */
export function estimateProcessingTime(durationSeconds: number, format: ExportFormat): number {
  // Base processing time: 10% of video duration
  let baseTime = durationSeconds * 0.1;

  // Portrait formats take longer due to AI processing
  if (format.format === '9:16') {
    baseTime *= 1.5;
  }

  // Minimum 5 seconds, maximum 300 seconds
  return Math.min(Math.max(baseTime, 5), 300);
}

export function getCroppingStrategyInfo(type: string): CroppingStrategyInfo | null {
  return CROPPING_STRATEGIES.find(strategy => strategy.type === type) || null;
}

export function getRecommendedCroppingStrategy(
  contentType: 'portrait' | 'landscape' | 'action' | 'presentation' | 'general',
  targetFormat: ExportFormat,
  hasAI: boolean = true
): string {
  if (!hasAI) {
    return 'center';
  }

  switch (contentType) {
    case 'portrait':
    case 'presentation':
      return 'face';
    case 'action':
      return 'motion-tracking';
    case 'landscape':
      return targetFormat.format === '1:1' ? 'smart' : 'center';
    default:
      return 'smart';
  }
}

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

export function generateBatchExportQueue(request: BatchExportRequest): ExportQueueItem[] {
  const queue: ExportQueueItem[] = [];
  const timestamp = Date.now();

  request.videoIds.forEach((videoId, index) => {
    request.formats.forEach(format => {
      request.platforms.forEach(platform => {
        const estimatedTime = estimateProcessingTime(30, format); // Assuming 30s videos by default
        queue.push({
          id: `${videoId}-${format.format}-${platform}-${timestamp}-${index}`,
          videoId,
          format: format.format,
          platform,
          status: 'pending',
          progress: 0,
          croppingType: request.croppingStrategy || 'smart',
          estimatedTime,
          retryCount: 0
        });
      });
    });
  });

  return queue;
} 