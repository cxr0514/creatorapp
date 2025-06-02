// Smart scheduling service for optimal post timing
// Provides intelligent recommendations for when to post content

export interface OptimalTimeRecommendation {
  datetime: Date
  confidence: number // 0-1 score
  reason: string
  platform: string
  timezone: string
}

export interface SchedulingOptions {
  platforms: string[]
  contentType: 'video' | 'image' | 'text'
  targetAudience?: 'general' | 'business' | 'entertainment' | 'educational'
  timezone: string
  minHoursBetweenPosts?: number
  excludeWeekends?: boolean
  excludeHours?: number[] // Hours to exclude (0-23)
}

export class SmartScheduler {
  // Platform-specific optimal times (based on industry research)
  private static PLATFORM_OPTIMAL_TIMES = {
    youtube: {
      weekdays: [14, 15, 16, 17, 18, 19, 20], // 2-8 PM
      weekends: [11, 12, 13, 14, 15, 16], // 11 AM-4 PM
      peak: [15, 16, 17] // 3-5 PM
    },
    tiktok: {
      weekdays: [6, 10, 19, 20, 21], // 6 AM, 10 AM, 7-9 PM
      weekends: [9, 10, 11, 12, 13], // 9 AM-1 PM
      peak: [19, 20] // 7-8 PM
    },
    instagram: {
      weekdays: [11, 12, 13, 17, 18, 19], // 11 AM-1 PM, 5-7 PM
      weekends: [10, 11, 12, 13, 14], // 10 AM-2 PM
      peak: [12, 18] // 12 PM, 6 PM
    },
    twitter: {
      weekdays: [8, 9, 12, 13, 15, 16, 17], // 8-9 AM, 12-1 PM, 3-5 PM
      weekends: [9, 10, 11, 12], // 9 AM-12 PM
      peak: [9, 12, 15] // 9 AM, 12 PM, 3 PM
    },
    linkedin: {
      weekdays: [8, 9, 10, 12, 13, 17, 18], // Business hours
      weekends: [], // Generally avoid weekends for LinkedIn
      peak: [9, 12, 17] // 9 AM, 12 PM, 5 PM
    }
  }

  // Content type multipliers for engagement
  private static CONTENT_TYPE_MULTIPLIERS = {
    video: { youtube: 1.2, tiktok: 1.3, instagram: 1.1, twitter: 1.0, linkedin: 0.9 },
    image: { youtube: 0.8, tiktok: 0.7, instagram: 1.3, twitter: 1.1, linkedin: 1.1 },
    text: { youtube: 0.5, tiktok: 0.3, instagram: 0.7, twitter: 1.2, linkedin: 1.2 }
  }

  static getOptimalTimes(
    options: SchedulingOptions,
    startDate = new Date(),
    daysAhead = 7
  ): OptimalTimeRecommendation[] {
    const recommendations: OptimalTimeRecommendation[] = []
    const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    for (const platform of options.platforms) {
      const platformTimes = this.PLATFORM_OPTIMAL_TIMES[platform as keyof typeof this.PLATFORM_OPTIMAL_TIMES]
      if (!platformTimes) continue

      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay() // 0 = Sunday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        // Skip weekends if excluded
        if (options.excludeWeekends && isWeekend) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        // Get appropriate hours for this day
        const availableHours = isWeekend ? platformTimes.weekends : platformTimes.weekdays
        
        for (const hour of availableHours) {
          // Skip excluded hours
          if (options.excludeHours?.includes(hour)) continue

          const datetime = new Date(currentDate)
          datetime.setHours(hour, 0, 0, 0)

          // Skip past times
          if (datetime <= new Date()) continue

          // Check minimum hours between posts
          if (this.isTooSoonAfterLastPost(datetime, recommendations, options.minHoursBetweenPosts || 4)) {
            continue
          }

          const confidence = this.calculateConfidence(
            platform,
            hour,
            isWeekend,
            options.contentType,
            options.targetAudience
          )

          const reason = this.generateReason(platform, hour, isWeekend, confidence)

          recommendations.push({
            datetime,
            confidence,
            reason,
            platform,
            timezone: options.timezone
          })
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    // Sort by confidence and return top recommendations
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 50) // Limit to top 50 recommendations
  }

  static getBatchSchedule(
    options: SchedulingOptions,
    postCount: number,
    startDate = new Date()
  ): OptimalTimeRecommendation[] {
    const allRecommendations = this.getOptimalTimes(options, startDate, 30) // Look 30 days ahead
    const batchSchedule: OptimalTimeRecommendation[] = []
    
    // Distribute posts evenly across platforms and times
    const postsPerPlatform = Math.ceil(postCount / options.platforms.length)
    
    for (const platform of options.platforms) {
      const platformRecommendations = allRecommendations
        .filter(rec => rec.platform === platform)
        .slice(0, postsPerPlatform)
      
      batchSchedule.push(...platformRecommendations)
    }

    return batchSchedule
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
      .slice(0, postCount)
  }

  static getNextOptimalTime(
    platform: string,
    contentType: 'video' | 'image' | 'text',
    timezone: string,
    afterDate = new Date()
  ): OptimalTimeRecommendation | null {
    const recommendations = this.getOptimalTimes({
      platforms: [platform],
      contentType,
      timezone
    }, afterDate, 7)

    return recommendations[0] || null
  }

  private static calculateConfidence(
    platform: string,
    hour: number,
    isWeekend: boolean,
    contentType: 'video' | 'image' | 'text',
    targetAudience?: string
  ): number {
    let confidence = 0.5 // Base confidence

    const platformTimes = this.PLATFORM_OPTIMAL_TIMES[platform as keyof typeof this.PLATFORM_OPTIMAL_TIMES]
    if (!platformTimes) return confidence

    // Peak time bonus
    if (platformTimes.peak.includes(hour)) {
      confidence += 0.3
    }

    // Content type multiplier
    const contentMultiplier = this.CONTENT_TYPE_MULTIPLIERS[contentType][platform as keyof typeof this.CONTENT_TYPE_MULTIPLIERS.video]
    confidence *= contentMultiplier

    // Weekend penalty for business platforms
    if (isWeekend && platform === 'linkedin') {
      confidence *= 0.3
    }

    // Target audience adjustments
    if (targetAudience === 'business' && platform === 'linkedin') {
      confidence *= 1.2
    } else if (targetAudience === 'entertainment' && platform === 'tiktok') {
      confidence *= 1.1
    }

    // Time of day adjustments
    if (hour >= 9 && hour <= 17) { // Business hours
      if (platform === 'linkedin') confidence *= 1.1
      if (platform === 'tiktok') confidence *= 0.9
    }

    return Math.min(Math.max(confidence, 0.1), 1.0) // Clamp between 0.1 and 1.0
  }

  private static generateReason(
    platform: string,
    hour: number,
    isWeekend: boolean,
    confidence: number
  ): string {
    const platformTimes = this.PLATFORM_OPTIMAL_TIMES[platform as keyof typeof this.PLATFORM_OPTIMAL_TIMES]
    
    if (confidence > 0.8) {
      return `Peak engagement time for ${platform}`
    } else if (confidence > 0.6) {
      return `High activity period for ${platform} audience`
    } else if (platformTimes?.peak.includes(hour)) {
      return `Optimal posting window for ${platform}`
    } else if (isWeekend) {
      return `Weekend activity time for ${platform}`
    } else {
      return `Good engagement time for ${platform}`
    }
  }

  private static isTooSoonAfterLastPost(
    datetime: Date,
    existingRecommendations: OptimalTimeRecommendation[],
    minHours: number
  ): boolean {
    const minMs = minHours * 60 * 60 * 1000
    
    return existingRecommendations.some(rec => 
      Math.abs(rec.datetime.getTime() - datetime.getTime()) < minMs
    )
  }

  // Analytics-based learning (placeholder for future ML integration)
  static learnFromPerformance(
    platform: string,
    postTime: Date,
    engagementScore: number,
    contentType: 'video' | 'image' | 'text'
  ): void {
    // TODO: Implement machine learning to improve recommendations
    // This would track performance data and adjust optimal times
    console.log('Learning from performance:', {
      platform,
      postTime,
      engagementScore,
      contentType
    })
  }
}
