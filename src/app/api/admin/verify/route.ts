import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is an admin
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    });
    
    return NextResponse.json({ 
      isAdmin: !!adminProfile,
      adminType: adminProfile?.role || null
    });
    
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return NextResponse.json({ isAdmin: false, error: 'Internal server error' }, { status: 500 });
  }
}
