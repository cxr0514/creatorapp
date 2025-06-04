import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Get audit logs for admin dashboard
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

    if (!adminProfile || !adminProfile.permissions.includes('audit_logs')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const targetType = searchParams.get('targetType');
    const action = searchParams.get('action');
    const adminId = searchParams.get('adminId');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (action) where.action = action;
    if (adminId) where.adminId = adminId;

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          targetUser: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return NextResponse.json({
      auditLogs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
