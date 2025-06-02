import { logger } from './logging';

export interface ErrorMetrics {
  totalErrors: number;
  errorsByPlatform: Record<string, number>;
  errorsByType: Record<string, number>;
  recentErrors: Array<{
    timestamp: string;
    platform: string;
    error: string;
    userId?: string;
    postId?: string;
  }>;
}

export interface HealthCheck {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    oauth: Record<string, boolean>;
    publishing: Record<string, boolean>;
    scheduling: boolean;
  };
  metrics: {
    totalPublishes: number;
    successfulPublishes: number;
    failedPublishes: number;
    avgProcessingTime: number;
  };
}

class ErrorMonitor {
  private errorCounts: Map<string, number> = new Map();
  private recentErrors: Array<{
    timestamp: string;
    platform: string;
    error: string;
    userId?: string;
    postId?: string;
  }> = [];
  private maxRecentErrors = 100;
  private healthMetrics = {
    totalPublishes: 0,
    successfulPublishes: 0,
    failedPublishes: 0,
    processingTimes: [] as number[]
  };

  async recordError(error: Error, context: {
    platform?: string;
    operation?: string;
    userId?: string;
    postId?: string;
  }) {
    const errorKey = `${context.platform || 'unknown'}_${context.operation || 'unknown'}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Add to recent errors
    this.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      platform: context.platform || 'unknown',
      operation: context.operation || 'unknown',
      error: error.message,
      stack: error.stack,
      userId: context.userId,
      postId: context.postId
    });

    // Keep only recent errors
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(0, this.maxRecentErrors);
    }

    // Log the error
    await logger.error(`Error in ${context.operation || 'operation'}`, error, context);

    // Check if we need to alert on high error rates
    await this.checkErrorThresholds(errorKey);
  }

  async recordPublishAttempt() {
    this.healthMetrics.totalPublishes++;
  }

  async recordPublishSuccess(processingTime: number) {
    this.healthMetrics.successfulPublishes++;
    this.healthMetrics.processingTimes.push(processingTime);
    
    // Keep only last 100 processing times for average calculation
    if (this.healthMetrics.processingTimes.length > 100) {
      this.healthMetrics.processingTimes = this.healthMetrics.processingTimes.slice(-100);
    }
  }

  async recordPublishFailure() {
    this.healthMetrics.failedPublishes++;
  }

  private async checkErrorThresholds(errorKey: string) {
    const count = this.errorCounts.get(errorKey) || 0;
    
    // Alert on high error rates
    if (count > 10) {
      await logger.warn(`High error rate detected for ${errorKey}`, {
        errorCount: count,
        threshold: 10,
        alert: 'high_error_rate'
      });
    }

    if (count > 50) {
      await logger.error(`Critical error rate detected for ${errorKey}`, undefined, {
        errorCount: count,
        threshold: 50,
        alert: 'critical_error_rate'
      });
    }
  }

  getErrorMetrics(): ErrorMetrics {
    const errorsByPlatform: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    for (const [key, count] of this.errorCounts.entries()) {
      const [platform, operation] = key.split('_');
      errorsByPlatform[platform] = (errorsByPlatform[platform] || 0) + count;
      errorsByType[operation] = (errorsByType[operation] || 0) + count;
    }

    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorsByPlatform,
      errorsByType,
      recentErrors: this.recentErrors.slice(0, 20) // Return last 20 errors
    };
  }

  async performHealthCheck(): Promise<HealthCheck> {
    const timestamp = new Date().toISOString();
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Test database connectivity
    let databaseHealthy = true;
    try {
      const { PrismaClient } = await import('../generated/prisma');
      const prisma = new PrismaClient();
      await prisma.$connect();
      await prisma.$disconnect();
    } catch (error) {
      databaseHealthy = false;
      await this.recordError(error as Error, { operation: 'health_check', platform: 'database' });
    }

    // Check OAuth platform health (simplified - would need actual API calls in production)
    const oauthHealth = {
      youtube: true, // Would test OAuth token refresh
      instagram: true,
      twitter: true,
      linkedin: true,
      tiktok: true
    };

    // Check publishing platform health (simplified)
    const publishingHealth = {
      youtube: true,
      instagram: true,
      twitter: true,
      linkedin: true,
      tiktok: true
    };

    // Check scheduling health
    const schedulingHealthy = true; // Would check background job processor

    // Calculate success rate
    const successRate = this.healthMetrics.totalPublishes > 0 
      ? this.healthMetrics.successfulPublishes / this.healthMetrics.totalPublishes 
      : 1;

    // Calculate average processing time
    const avgProcessingTime = this.healthMetrics.processingTimes.length > 0
      ? this.healthMetrics.processingTimes.reduce((sum, time) => sum + time, 0) / this.healthMetrics.processingTimes.length
      : 0;

    // Determine overall status
    if (!databaseHealthy || successRate < 0.5) {
      overallStatus = 'unhealthy';
    } else if (successRate < 0.9 || avgProcessingTime > 10000) { // 10 seconds
      overallStatus = 'degraded';
    }

    const healthCheck: HealthCheck = {
      timestamp,
      status: overallStatus,
      checks: {
        database: databaseHealthy,
        oauth: oauthHealth,
        publishing: publishingHealth,
        scheduling: schedulingHealthy
      },
      metrics: {
        totalPublishes: this.healthMetrics.totalPublishes,
        successfulPublishes: this.healthMetrics.successfulPublishes,
        failedPublishes: this.healthMetrics.failedPublishes,
        avgProcessingTime
      }
    };

    await logger.info('Health check completed', {
      status: overallStatus,
      successRate: successRate.toFixed(2),
      avgProcessingTime: avgProcessingTime.toFixed(2)
    });

    return healthCheck;
  }

  // Reset metrics (useful for testing or periodic resets)
  resetMetrics() {
    this.errorCounts.clear();
    this.recentErrors = [];
    this.healthMetrics = {
      totalPublishes: 0,
      successfulPublishes: 0,
      failedPublishes: 0,
      processingTimes: []
    };
  }

  // Get circuit breaker status for a platform (prevent cascading failures)
  shouldCircuitBreak(platform: string): boolean {
    const recentPlatformErrors = this.recentErrors
      .filter(error => error.platform === platform)
      .filter(error => {
        const errorTime = new Date(error.timestamp);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return errorTime > fiveMinutesAgo;
      });

    // Circuit break if more than 5 errors in the last 5 minutes
    return recentPlatformErrors.length > 5;
  }
}

// Export singleton instance
export const errorMonitor = new ErrorMonitor();
