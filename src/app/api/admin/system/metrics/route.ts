import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Get system metrics (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    });

    if (!adminProfile || !adminProfile.permissions.includes('system_monitoring')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('type');
    const timeRange = searchParams.get('range') || '24h';

    // Calculate time range
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setDate(now.getDate() - 1);
    }

    const where: Record<string, unknown> = {
      timestamp: {
        gte: startTime
      }
    };

    if (metricType) where.metricType = metricType;

    const metrics = await prisma.systemMetric.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Calculate summary statistics
    const summary = {
      totalMetrics: metrics.length,
      avgValue: metrics.length > 0 ? metrics.reduce((sum, m) => sum + Number(m.value), 0) / metrics.length : 0,
      maxValue: metrics.length > 0 ? Math.max(...metrics.map(m => Number(m.value))) : 0,
      minValue: metrics.length > 0 ? Math.min(...metrics.map(m => Number(m.value))) : 0
    };

    return NextResponse.json({
      metrics,
      summary,
      timeRange: {
        start: startTime,
        end: now,
        range: timeRange
      }
    });

  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Record system metric
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or system service
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    });

    if (!adminProfile || !adminProfile.permissions.includes('system_monitoring')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { type, value, metadata } = await request.json();

    const metric = await prisma.systemMetric.create({
      data: {
        metricType: type,
        value,
        metadata: metadata || {}
      }
    });

    return NextResponse.json({ metric });

  } catch (error) {
    console.error('Error recording system metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
