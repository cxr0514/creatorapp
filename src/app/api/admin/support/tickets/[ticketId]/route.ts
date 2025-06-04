import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendEmail, generateSupportTicketNotificationEmail } from '@/lib/email';

interface Params {
  ticketId: string;
}

// Get a specific ticket (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
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

    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        responses: {
          include: {
            admin: {
              include: {
                user: {
                  select: {
                    name: true,
                    image: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add admin response to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
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

    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { content, updateStatus } = await request.json();

    // Create the response
    const response = await prisma.supportResponse.create({
      data: {
        content,
        ticketId: params.ticketId,
        adminId: adminProfile.id
      }
    });

    // Update ticket status if requested
    if (updateStatus) {
      await prisma.supportTicket.update({
        where: { id: params.ticketId },
        data: { status: updateStatus }
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: adminProfile.id,
        action: 'ticket_response_created',
        targetType: 'support_ticket',
        targetId: params.ticketId,
        details: {
          responseId: response.id
        }
      }
    });
    
    // Get the ticket with user info to send notification
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.ticketId },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    if (ticket?.user?.email) {
      // Send email notification to user
      const { html, text } = generateSupportTicketNotificationEmail(
        params.ticketId,
        ticket.subject
      );
      
      await sendEmail({
        to: ticket.user.email,
        subject: `New response to your support ticket: ${ticket.subject}`,
        html,
        text
      });
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error responding to ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
