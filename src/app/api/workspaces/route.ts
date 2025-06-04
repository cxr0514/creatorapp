import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Get user's workspaces
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: {
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
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    return NextResponse.json({ workspaces });

  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new workspace
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    // Check if user has permission to create workspaces (premium feature)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user?.subscription || !user.subscription.plan) {
      return NextResponse.json({ error: 'Workspace creation requires premium subscription' }, { status: 403 });
    }

    // Check if features is an array or includes workspaces feature
    const features = user.subscription.plan.features;
    const hasWorkspaceFeature = Array.isArray(features) 
      ? features.includes('workspaces')
      : features && typeof features === 'object' && 'workspaces' in features;

    if (!hasWorkspaceFeature) {
      return NextResponse.json({ error: 'Workspace creation requires premium subscription' }, { status: 403 });
    }

    // Generate a slug from the workspace name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        owner: {
          connect: {
            id: session.user.id
          }
        },
        members: {
          create: {
            userId: session.user.id,
            role: 'owner'
          }
        }
      },
      include: {
        members: {
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
        }
      }
    });

    return NextResponse.json({ workspace });

  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
