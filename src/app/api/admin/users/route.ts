import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Get all users for admin management
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    });

    if (!adminProfile || !adminProfile.permissions.includes('user_management')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true,
        lastLoginAt: true,
        isActive: true,
        accountStatus: true,
        totalStorage: true,
        usageStats: true,
        subscription: {
          select: {
            status: true,
            plan: {
              select: {
                name: true,
                displayName: true
              }
            }
          }
        },
        _count: {
          select: {
            videos: true,
            clips: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
