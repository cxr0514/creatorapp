import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface UpdateTemplateRequest {
  name?: string;
  fontFamily?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  introCloudinaryId?: string;
  outroCloudinaryId?: string;
  logoCloudinaryId?: string;
  lowerThirdText?: string;
  lowerThirdPosition?: string;
  callToActionText?: string;
  callToActionUrl?: string;
  callToActionPosition?: string;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Note: This will cause a linter error until the schema is updated
    const template = await (prisma as any).styleTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('[API/TEMPLATES/[ID] GET] Error fetching template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body: UpdateTemplateRequest = await request.json();

    // Verify template exists and belongs to user
    const existingTemplate = await (prisma as any).styleTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // If name is being updated, check for duplicates
    if (body.name && body.name.trim() !== existingTemplate.name) {
      const duplicateTemplate = await (prisma as any).styleTemplate.findFirst({
        where: {
          userId: user.id,
          name: body.name.trim(),
          id: { not: templateId }
        }
      });

      if (duplicateTemplate) {
        return NextResponse.json({ error: 'Template name already exists' }, { status: 400 });
      }
    }

    const updatedTemplate = await (prisma as any).styleTemplate.update({
      where: { id: templateId },
      data: {
        ...body,
        name: body.name ? body.name.trim() : undefined,
        updatedAt: new Date()
      }
    });

    console.log('[API/TEMPLATES/[ID] PUT] Updated template:', templateId);
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('[API/TEMPLATES/[ID] PUT] Error updating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify template exists and belongs to user
    const existingTemplate = await (prisma as any).styleTemplate.findFirst({
      where: {
        id: templateId,
        userId: user.id
      }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await (prisma as any).styleTemplate.delete({
      where: { id: templateId }
    });

    console.log('[API/TEMPLATES/[ID] DELETE] Deleted template:', templateId);
    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('[API/TEMPLATES/[ID] DELETE] Error deleting template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 