import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Get workspace members
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = params;

    // Check if user is member of workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ members });

  } catch (error) {
    console.error('Error fetching workspace members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Invite user to workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = params;
    const { email, role = 'member', message } = await request.json();

    // Check if user is owner or admin of workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Check if already member
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: existingUser.id
        }
      });

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
      }

      // Add directly as member
      const newMember = await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: existingUser.id,
          role
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      return NextResponse.json({ member: newMember });
    }

    // Create invitation for non-existing user
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        invitedBy: session.user.id,
        email,
        role,
        message,
        token: generateInviteToken()
      }
    });

    // TODO: Send invitation email
    
    return NextResponse.json({ invitation });

  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateInviteToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
