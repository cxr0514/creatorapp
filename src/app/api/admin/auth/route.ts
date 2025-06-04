import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateAdminToken } from '@/lib/auth/jwt';

// Admin login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with admin profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: { adminProfile: true }
    });

    if (!user || !user.adminProfile || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (!user.isActive || user.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = await generateAdminToken(user.id);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to generate authentication token' },
        { status: 500 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log admin login
    await prisma.auditLog.create({
      data: {
        adminId: user.adminProfile.id,
        action: 'admin_login',
        targetType: 'user',
        targetId: user.id,
        details: {
          email: user.email,
          loginTime: new Date()
        }
      }
    });

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: user.adminProfile.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.adminProfile.role,
        permissions: user.adminProfile.permissions
      }
    });

  } catch (error) {
    console.error('Error in admin login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify admin token endpoint
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const { verifyAdminToken } = await import('@/lib/auth/jwt');
    const admin = await verifyAdminToken(token);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      admin: {
        id: admin.adminId,
        userId: admin.userId,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Error verifying admin token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
