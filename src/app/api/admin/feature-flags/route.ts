import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Get feature flags
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const featureFlags = await prisma.featureFlag.findMany({
      where: {
        isActive: true
      }
    });

    // Return flags as key-value pairs for easy consumption
    const flags = featureFlags.reduce((acc, flag) => {
      acc[flag.name] = flag.value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ flags });

  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update feature flag (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    });

    if (!adminProfile || !adminProfile.permissions.includes('feature_flags')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, value, description, isActive = true } = await request.json();

    const featureFlag = await prisma.featureFlag.upsert({
      where: { name },
      update: {
        value,
        description,
        isActive,
        updatedAt: new Date()
      },
      create: {
        name,
        value,
        description,
        isActive
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: adminProfile.id,
        action: 'feature_flag_updated',
        targetType: 'feature_flag',
        targetId: featureFlag.id,
        details: {
          flagName: name,
          newValue: value,
          isActive
        }
      }
    });

    return NextResponse.json({ featureFlag });

  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
