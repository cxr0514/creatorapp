import { appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  postId?: string;
  platform?: string;
  error?: Error;
}

class Logger {
  private logDir: string;

  constructor() {
    this.logDir = join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      await mkdir(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    
    if (entry.metadata || entry.userId || entry.postId || entry.platform) {
      const meta = {
        ...(entry.userId && { userId: entry.userId }),
        ...(entry.postId && { postId: entry.postId }),
        ...(entry.platform && { platform: entry.platform }),
        ...entry.metadata
      };
      return `${base} | ${JSON.stringify(meta)}`;
    }

    if (entry.error) {
      return `${base}\nStack: ${entry.error.stack}`;
    }

    return base;
  }

  private async writeToFile(filename: string, content: string) {
    const filePath = join(this.logDir, filename);
    try {
      await appendFile(filePath, content + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
      // Fallback to console
      console.log(content);
    }
  }

  async log(entry: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    const formattedEntry = this.formatLogEntry(logEntry);
    
    // Write to appropriate log file
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}.log`;
    
    await this.writeToFile(filename, formattedEntry);

    // Also write to level-specific files
    if (entry.level === 'error') {
      await this.writeToFile(`errors-${date}.log`, formattedEntry);
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = entry.level === 'error' ? 'error' : 
                           entry.level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](formattedEntry);
    }
  }

  async info(message: string, metadata?: Record<string, unknown>) {
    await this.log({ level: 'info', message, metadata });
  }

  async warn(message: string, metadata?: Record<string, unknown>) {
    await this.log({ level: 'warn', message, metadata });
  }

  async error(message: string, error?: Error, metadata?: Record<string, unknown>) {
    await this.log({ level: 'error', message, error, metadata });
  }

  async debug(message: string, metadata?: Record<string, unknown>) {
    await this.log({ level: 'debug', message, metadata });
  }

  // Specialized methods for social media operations
  async logPublishAttempt(postId: string, platform: string, userId: string) {
    await this.info(`Publishing attempt started`, {
      postId,
      platform,
      userId,
      operation: 'publish'
    });
  }

  async logPublishSuccess(postId: string, platform: string, userId: string, platformPostId?: string) {
    await this.info(`Publishing successful`, {
      postId,
      platform,
      userId,
      platformPostId,
      operation: 'publish',
      status: 'success'
    });
  }

  async logPublishFailure(postId: string, platform: string, userId: string, error: Error) {
    await this.error(`Publishing failed`, error, {
      postId,
      platform,
      userId,
      operation: 'publish',
      status: 'failed'
    });
  }

  async logSchedulingAttempt(postId: string, scheduledTime: Date, userId: string) {
    await this.info(`Post scheduling attempt`, {
      postId,
      scheduledTime: scheduledTime.toISOString(),
      userId,
      operation: 'schedule'
    });
  }

  async logSchedulingSuccess(postId: string, scheduledTime: Date, userId: string) {
    await this.info(`Post scheduled successfully`, {
      postId,
      scheduledTime: scheduledTime.toISOString(),
      userId,
      operation: 'schedule',
      status: 'success'
    });
  }

  async logSchedulingFailure(postId: string, error: Error, userId: string) {
    await this.error(`Post scheduling failed`, error, {
      postId,
      userId,
      operation: 'schedule',
      status: 'failed'
    });
  }

  async logOAuthSuccess(platform: string, userId: string) {
    await this.info(`OAuth connection successful`, {
      platform,
      userId,
      operation: 'oauth',
      status: 'success'
    });
  }

  async logOAuthFailure(platform: string, error: Error, userId?: string) {
    await this.error(`OAuth connection failed`, error, {
      platform,
      userId,
      operation: 'oauth',
      status: 'failed'
    });
  }

  async logTokenRefresh(platform: string, userId: string, success: boolean) {
    const level = success ? 'info' : 'warn';
    const message = success ? 'Token refresh successful' : 'Token refresh failed';
    
    await this.log({
      level,
      message,
      metadata: {
        platform,
        userId,
        operation: 'token_refresh',
        status: success ? 'success' : 'failed'
      }
    });
  }
}

// Export singleton instance
export const logger = new Logger();
