/**
 * Debug Logger Utility
 * Simple logging utility for development debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Type for any serializable data that can be logged
type LogData = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

class DebugLogger {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, component: string, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`;
    return data ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  private log(level: LogLevel, component: string, message: string, data?: LogData) {
    if (!this.isEnabled) return;

    const formattedMessage = this.formatMessage(level, component, message, data);
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'debug':
      default:
        console.log(formattedMessage, data || '');
        break;
    }
  }

  debug(component: string, message: string, data?: LogData) {
    this.log('debug', component, message, data);
  }

  info(component: string, message: string, data?: LogData) {
    this.log('info', component, message, data);
  }

  warn(component: string, message: string, data?: LogData) {
    this.log('warn', component, message, data);
  }

  error(component: string, message: string, data?: LogData) {
    this.log('error', component, message, data);
  }
}

// Export singleton instance
export const debugLogger = new DebugLogger();
