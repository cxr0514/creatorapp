import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Update user account status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    });

    if (!adminProfile || !adminProfile.permissions.includes('user_management')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, reason } = await request.json();
    const { userId } = params;

    let updateData: Record<string, unknown> = {};
    let auditAction = '';

    switch (action) {
      case 'suspend':
        updateData = {
          accountStatus: 'suspended',
          suspensionReason: reason,
          suspendedAt: new Date(),
          suspendedBy: session.user.id,
          isActive: false
        };
        auditAction = 'user_suspended';
        break;
      case 'activate':
        updateData = {
          accountStatus: 'active',
          suspensionReason: null,
          suspendedAt: null,
          suspendedBy: null,
          isActive: true
        };
        auditAction = 'user_activated';
        break;
      case 'ban':
        updateData = {
          accountStatus: 'banned',
          suspensionReason: reason,
          suspendedAt: new Date(),
          suspendedBy: session.user.id,
          isActive: false
        };
        auditAction = 'user_banned';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        accountStatus: true,
        isActive: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: adminProfile.id,
        action: auditAction,
        targetType: 'user',
        targetId: userId,
        targetUserId: userId,
        details: {
          reason,
          previousStatus: 'active' // Could be enhanced to track previous status
        }
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
