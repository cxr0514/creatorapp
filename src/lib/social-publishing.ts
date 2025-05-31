// Social media publishing and scheduling utilities

export interface SocialPlatform {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  supportedFormats: string[];
  maxFileSize: number; // in MB
  maxDuration: number; // in seconds
  supportsScheduling: boolean;
  requiresAuth: boolean;
}

export interface SocialAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  permissions: string[];
}

export interface ScheduledPost {
  id: string;
  clipId: number;
  userId: string;
  platform: string;
  accountId: string;
  scheduledTime: Date;
  status: 'pending' | 'posted' | 'failed' | 'cancelled';
  title: string;
  description?: string;
  hashtags?: string[];
  thumbnailUrl?: string;
  videoUrl: string;
  postId?: string; // Platform-specific post ID after posting
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostContent {
  title: string;
  description?: string;
  hashtags?: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  visibility?: 'public' | 'unlisted' | 'private';
}

// Supported social media platforms
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'youtube',
    name: 'youtube',
    displayName: 'YouTube',
    icon: '/icons/youtube.svg',
    supportedFormats: ['16:9', '9:16', '1:1'],
    maxFileSize: 256000, // 256GB (practically unlimited)
    maxDuration: 43200, // 12 hours
    supportsScheduling: true,
    requiresAuth: true
  },
  {
    id: 'tiktok',
    name: 'tiktok',
    displayName: 'TikTok',
    icon: '/icons/tiktok.svg',
    supportedFormats: ['9:16'],
    maxFileSize: 287, // ~287MB
    maxDuration: 600, // 10 minutes
    supportsScheduling: true,
    requiresAuth: true
  },
  {
    id: 'instagram',
    name: 'instagram',
    displayName: 'Instagram',
    icon: '/icons/instagram.svg',
    supportedFormats: ['9:16', '1:1', '16:9'],
    maxFileSize: 100, // 100MB for video
    maxDuration: 3600, // 60 minutes for reels
    supportsScheduling: true,
    requiresAuth: true
  },
  {
    id: 'twitter',
    name: 'twitter',
    displayName: 'X (Twitter)',
    icon: '/icons/twitter.svg',
    supportedFormats: ['16:9', '1:1', '9:16'],
    maxFileSize: 512, // 512MB
    maxDuration: 140, // 2 minutes 20 seconds
    supportsScheduling: true,
    requiresAuth: true
  },
  {
    id: 'linkedin',
    name: 'linkedin',
    displayName: 'LinkedIn',
    icon: '/icons/linkedin.svg',
    supportedFormats: ['16:9', '1:1'],
    maxFileSize: 200, // 200MB
    maxDuration: 600, // 10 minutes
    supportsScheduling: false, // LinkedIn API doesn't support scheduling
    requiresAuth: true
  }
];

// Platform-specific content optimization
export const PLATFORM_CONTENT_GUIDELINES = {
  youtube: {
    titleMaxLength: 100,
    descriptionMaxLength: 5000,
    recommendedHashtags: 3,
    bestTimes: ['2pm-4pm', '6pm-9pm'],
    timezone: 'PST'
  },
  tiktok: {
    titleMaxLength: 150,
    descriptionMaxLength: 2200,
    recommendedHashtags: 5,
    bestTimes: ['6am-10am', '7pm-9pm'],
    timezone: 'PST'
  },
  instagram: {
    titleMaxLength: 125,
    descriptionMaxLength: 2200,
    recommendedHashtags: 10,
    bestTimes: ['11am-1pm', '7pm-9pm'],
    timezone: 'PST'
  },
  twitter: {
    titleMaxLength: 280,
    descriptionMaxLength: 280,
    recommendedHashtags: 2,
    bestTimes: ['9am-10am', '12pm-1pm', '5pm-6pm'],
    timezone: 'PST'
  },
  linkedin: {
    titleMaxLength: 150,
    descriptionMaxLength: 1300,
    recommendedHashtags: 3,
    bestTimes: ['8am-10am', '12pm-2pm', '5pm-6pm'],
    timezone: 'PST'
  }
};

// Helper functions
export function getPlatformById(platformId: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find(p => p.id === platformId);
}

export function getPlatformGuidelines(platformId: string) {
  return PLATFORM_CONTENT_GUIDELINES[platformId as keyof typeof PLATFORM_CONTENT_GUIDELINES];
}

export function validateContentForPlatform(content: PostContent, platform: SocialPlatform): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const guidelines = getPlatformGuidelines(platform.id);

  if (!guidelines) {
    errors.push('Platform guidelines not found');
    return { valid: false, errors, warnings };
  }

  // Validate title length
  if (content.title.length > guidelines.titleMaxLength) {
    errors.push(`Title too long (${content.title.length}/${guidelines.titleMaxLength} chars)`);
  }

  // Validate description length
  if (content.description && content.description.length > guidelines.descriptionMaxLength) {
    errors.push(`Description too long (${content.description.length}/${guidelines.descriptionMaxLength} chars)`);
  }

  // Validate hashtags count
  if (content.hashtags) {
    if (content.hashtags.length > guidelines.recommendedHashtags * 2) {
      warnings.push(`Too many hashtags (${content.hashtags.length}). Recommended: ${guidelines.recommendedHashtags}`);
    } else if (content.hashtags.length < guidelines.recommendedHashtags) {
      warnings.push(`Consider adding more hashtags. Recommended: ${guidelines.recommendedHashtags}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function getOptimalPostTimes(platformId: string): string[] {
  const guidelines = getPlatformGuidelines(platformId);
  // TODO: Implement timezone conversion for optimal post times
  return guidelines?.bestTimes || [];
}

export function formatContentForPlatform(content: PostContent, platform: SocialPlatform): PostContent {
  const guidelines = getPlatformGuidelines(platform.id);
  if (!guidelines) return content;

  const formatted = { ...content };

  // Truncate title if needed
  if (formatted.title.length > guidelines.titleMaxLength) {
    formatted.title = formatted.title.substring(0, guidelines.titleMaxLength - 3) + '...';
  }

  // Truncate description if needed
  if (formatted.description && formatted.description.length > guidelines.descriptionMaxLength) {
    formatted.description = formatted.description.substring(0, guidelines.descriptionMaxLength - 3) + '...';
  }

  // Limit hashtags if needed
  if (formatted.hashtags && formatted.hashtags.length > guidelines.recommendedHashtags * 2) {
    formatted.hashtags = formatted.hashtags.slice(0, guidelines.recommendedHashtags);
  }

  return formatted;
}

// Workflow automation
export interface PublishingWorkflow {
  id: string;
  name: string;
  description?: string;
  userId: string;
  platforms: string[];
  scheduleType: 'immediate' | 'optimal' | 'custom';
  customSchedule?: {
    platform: string;
    delay: number; // minutes after trigger
  }[];
  contentTemplate: {
    titleTemplate?: string;
    descriptionTemplate?: string;
    hashtagsTemplate?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function generateWorkflowSchedule(
  workflow: PublishingWorkflow,
  baseTime: Date = new Date()
): { platform: string; scheduledTime: Date }[] {
  const schedule: { platform: string; scheduledTime: Date }[] = [];

  workflow.platforms.forEach(platformId => {
    let scheduledTime = new Date(baseTime);

    switch (workflow.scheduleType) {
      case 'immediate':
        // Post immediately
        break;
      
      case 'optimal':
        // Use platform optimal times (implement optimal time logic)
        const optimalTimes = getOptimalPostTimes(platformId);
        if (optimalTimes.length > 0) {
          // For demo, just add 1 hour
          scheduledTime = new Date(baseTime.getTime() + 60 * 60 * 1000);
        }
        break;
      
      case 'custom':
        // Use custom delays
        const customDelay = workflow.customSchedule?.find(s => s.platform === platformId);
        if (customDelay) {
          scheduledTime = new Date(baseTime.getTime() + customDelay.delay * 60 * 1000);
        }
        break;
    }

    schedule.push({ platform: platformId, scheduledTime });
  });

  return schedule;
}

export function applyContentTemplate(
  content: PostContent,
  template: PublishingWorkflow['contentTemplate'],
  variables: Record<string, string> = {}
): PostContent {
  const processed = { ...content };

  // Apply title template
  if (template.titleTemplate) {
    processed.title = replaceTemplateVariables(template.titleTemplate, variables);
  }

  // Apply description template
  if (template.descriptionTemplate) {
    processed.description = replaceTemplateVariables(template.descriptionTemplate, variables);
  }

  // Apply hashtags template
  if (template.hashtagsTemplate) {
    processed.hashtags = template.hashtagsTemplate;
  }

  return processed;
}

function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
}
