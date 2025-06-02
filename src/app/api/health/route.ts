import { NextRequest, NextResponse } from 'next/server';
import { errorMonitor } from '@/lib/error-monitoring';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    // Perform comprehensive health check
    const healthCheck = await errorMonitor.performHealthCheck();
    const errorMetrics = errorMonitor.getErrorMetrics();

    const response = {
      ...healthCheck,
      errorMetrics,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    // Set appropriate HTTP status based on health
    const status = healthCheck.status === 'healthy' ? 200 :
                  healthCheck.status === 'degraded' ? 206 : 503;

    await logger.info('Health check API called', {
      status: healthCheck.status,
      totalErrors: errorMetrics.totalErrors,
      requestIP: request.ip || 'unknown'
    });

    return NextResponse.json(response, { status });
  } catch (error) {
    await logger.error('Health check API failed', error as Error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Allow resetting metrics for testing/maintenance
    if (body.action === 'reset-metrics') {
      errorMonitor.resetMetrics();
      await logger.info('Health metrics reset via API');
      
      return NextResponse.json({
        success: true,
        message: 'Metrics reset successfully'
      });
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });
  } catch (error) {
    await logger.error('Health check POST API failed', error as Error);
    
    return NextResponse.json({
      error: 'Invalid request'
    }, { status: 400 });
  }
}
