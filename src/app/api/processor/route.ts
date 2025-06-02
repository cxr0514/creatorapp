import { NextRequest, NextResponse } from 'next/server';
import { enhancedScheduledPostProcessor } from '@/lib/enhanced-scheduled-post-processor';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    const status = enhancedScheduledPostProcessor.getStatus();
    const healthCheck = await enhancedScheduledPostProcessor.getHealthCheck();

    await logger.info('Processor status requested', {
      requestIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      isRunning: status.isRunning
    });

    return NextResponse.json({
      ...status,
      healthCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await logger.error('Failed to get processor status', error as Error);
    
    return NextResponse.json({
      error: 'Failed to get processor status'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, intervalMs, postId } = body;

    switch (action) {
      case 'start':
        enhancedScheduledPostProcessor.start(intervalMs);
        await logger.info('Processor started via API', { intervalMs });
        return NextResponse.json({ success: true, message: 'Processor started' });

      case 'stop':
        enhancedScheduledPostProcessor.stop();
        await logger.info('Processor stopped via API');
        return NextResponse.json({ success: true, message: 'Processor stopped' });

      case 'retry':
        if (!postId) {
          return NextResponse.json({ error: 'postId required for retry' }, { status: 400 });
        }
        
        const result = await enhancedScheduledPostProcessor.retryFailedPost(postId);
        await logger.info('Manual retry executed via API', { postId, success: result.success });
        
        return NextResponse.json({
          success: true,
          result
        });

      case 'process-now':
        // Trigger immediate processing of due posts
        enhancedScheduledPostProcessor.processScheduledPosts().catch(async (error) => {
          await logger.error('Manual processing failed', error);
        });
        
        await logger.info('Manual processing triggered via API');
        return NextResponse.json({ success: true, message: 'Processing triggered' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    await logger.error('Processor API error', error as Error);
    
    return NextResponse.json({
      error: 'Processor operation failed'
    }, { status: 500 });
  }
}
