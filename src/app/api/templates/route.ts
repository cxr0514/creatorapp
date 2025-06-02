import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface CreateTemplateRequest {
  name: string;
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          image: session.user.image,
        }
      });
    }

    const templates = await (prisma as any).styleTemplate.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('[API/TEMPLATES GET] Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          image: session.user.image,
        }
      });
    }

    const body: CreateTemplateRequest = await request.json();
    const { name, ...templateData } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    // Check if template name already exists for this user
    const existingTemplate = await (prisma as any).styleTemplate.findFirst({
      where: {
        userId: user.id,
        name: name.trim()
      }
    });

    if (existingTemplate) {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 400 });
    }

    const template = await (prisma as any).styleTemplate.create({
      data: {
        name: name.trim(),
        userId: user.id,
        ...templateData
      }
    });

    console.log('[API/TEMPLATES POST] Created new template:', template.id, template.name);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('[API/TEMPLATES POST] Error creating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 