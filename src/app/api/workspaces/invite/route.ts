import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendEmail, generateWorkspaceInviteEmail } from '@/lib/email';

// Send workspace invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, email, role } = await request.json();

    // Check if workspace exists and user is a member with admin rights
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: {
            userId: session.user.id,
            role: { in: ['ADMIN', 'OWNER'] }
          }
        }
      }
    });

    if (!workspace || workspace.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to invite users to this workspace' }, { status: 403 });
    }
    
    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: {
          email
        }
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 });
    }
    
    // Check for existing invitation
    const existingInvite = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        status: 'PENDING'
      }
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 400 });
    }
    
    // Generate unique token
    const token = randomBytes(32).toString('hex');
    
    // Set expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create invitation
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        role: role || 'MEMBER',
        token,
        expiresAt,
        inviterId: session.user.id,
        status: 'PENDING'
      },
      include: {
        workspace: true,
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    // Send email
    const inviterName = session.user.name || session.user.email || 'A team member';
    const { html, text } = generateWorkspaceInviteEmail(
      inviterName, 
      workspace.name, 
      token
    );
    
    await sendEmail({
      to: email,
      subject: `${inviterName} invited you to collaborate in ${workspace.name}`,
      html,
      text
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'invite_sent',
        targetType: 'workspace',
        targetId: workspaceId,
        details: {
          workspaceName: workspace.name,
          inviteeEmail: email,
          role: role || 'MEMBER'
        }
      }
    });
    
    return NextResponse.json({ 
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error sending workspace invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
