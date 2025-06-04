import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export interface AdminTokenPayload {
  userId: string;
  adminId: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for admin user
 */
export async function generateAdminToken(userId: string): Promise<string | null> {
  try {
    const adminProfile = await prisma.admin.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!adminProfile) {
      return null;
    }

    const payload: Omit<AdminTokenPayload, 'iat' | 'exp'> = {
      userId: adminProfile.userId,
      adminId: adminProfile.id,
      email: adminProfile.user.email,
      role: adminProfile.role,
      permissions: adminProfile.permissions
    };

    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '24h',
      issuer: 'creatorapp-admin'
    });

    return token;
  } catch (error) {
    console.error('Error generating admin token:', error);
    return null;
  }
}

/**
 * Verify and decode admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'creatorapp-admin'
    }) as AdminTokenPayload;

    // Additional verification: check if admin still exists and is active
    const adminProfile = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      include: { user: true }
    });

    if (!adminProfile || !adminProfile.user.isActive) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return null;
  }
}

/**
 * Extract admin token from request headers
 */
export function extractAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
}

/**
 * Middleware function to verify admin authentication and permissions
 */
export async function verifyAdminAuth(
  request: NextRequest, 
  requiredPermissions: string[] = []
): Promise<{ isValid: boolean; admin?: AdminTokenPayload; error?: string }> {
  const token = extractAdminToken(request);
  
  if (!token) {
    return { isValid: false, error: 'No authentication token provided' };
  }

  const admin = await verifyAdminToken(token);
  
  if (!admin) {
    return { isValid: false, error: 'Invalid or expired token' };
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => 
      admin.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      return { 
        isValid: false, 
        error: `Insufficient permissions. Required: ${requiredPermissions.join(' or ')}` 
      };
    }
  }

  return { isValid: true, admin };
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(admin: AdminTokenPayload, permission: string): boolean {
  return admin.permissions.includes(permission);
}

/**
 * Check if admin has any of the specified permissions
 */
export function hasAnyPermission(admin: AdminTokenPayload, permissions: string[]): boolean {
  return permissions.some(permission => admin.permissions.includes(permission));
}
