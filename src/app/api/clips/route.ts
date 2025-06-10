import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { addClipToProcessingQueue } from '@/lib/queues/clip-processing-queue';

interface CreateClipRequest {
  originalVideoId: string;
  title: string;
  description?: string;
  hashtags?: string;
  startTime: number;
  endTime: number;
  platform: string;
  aspectRatio: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    // Fetch clips from database
    const clips = await prisma.clip.findMany({
      where: {
        userId: session.user.id,
        ...(videoId && { videoId: parseInt(videoId) })
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            storageKey: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform clips to match the expected interface
    const transformedClips = clips.map(clip => ({
      id: clip.id,
      title: clip.title,
      description: clip.description,
      hashtags: clip.hashtags,
      startTime: clip.startTime,
      endTime: clip.endTime,
      aspectRatio: clip.aspectRatio,
      platform: 'general', // Default platform since it's not stored in DB yet
      status: clip.status as 'processing' | 'ready' | 'failed' | 'error',
      createdAt: clip.createdAt.toISOString(),
      video: {
        id: clip.video.id,
        title: clip.video.title,
        filename: clip.video.storageKey || `video_${clip.video.id}.mp4`
      },
      thumbnailUrl: clip.thumbnailUrl,
      url: clip.storageUrl
    }));

    return NextResponse.json({ data: transformedClips });
  } catch (error) {
    console.error('Error fetching clips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clips' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestData = (await request.json()) as CreateClipRequest;
    
    if (!requestData.originalVideoId || !requestData.title) {
      return NextResponse.json(
        { error: 'originalVideoId and title are required' }, 
        { status: 400 }
      );
    }

    // Verify the video belongs to the user
    const video = await prisma.video.findFirst({
      where: {
        id: parseInt(requestData.originalVideoId),
        userId: session.user.id
      }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate duration
    const duration = requestData.endTime - requestData.startTime;

    // Create clip in database
    const newClip = await prisma.clip.create({
      data: {
        title: requestData.title,
        description: requestData.description,
        hashtags: requestData.hashtags ? requestData.hashtags.split(',').map(tag => tag.trim()) : [],
        startTime: requestData.startTime,
        endTime: requestData.endTime,
        duration: duration,
        aspectRatio: requestData.aspectRatio,
        status: 'processing',
        userId: session.user.id,
        videoId: parseInt(requestData.originalVideoId),
        // Note: storageKey and storageUrl will be set when the clip processing is complete
        thumbnailUrl: `https://picsum.photos/seed/clip_${Date.now()}/300/200`
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            storageKey: true
          }
        }
      }
    });

    // Transform to match expected interface
    const transformedClip = {
      id: newClip.id,
      title: newClip.title,
      description: newClip.description,
      hashtags: newClip.hashtags,
      startTime: newClip.startTime,
      endTime: newClip.endTime,
      aspectRatio: newClip.aspectRatio,
      platform: requestData.platform,
      status: newClip.status as 'processing' | 'ready' | 'failed' | 'error',
      createdAt: newClip.createdAt.toISOString(),
      video: {
        id: newClip.video.id,
        title: newClip.video.title,
        filename: newClip.video.storageKey || `video_${newClip.video.id}.mp4`
      },
      thumbnailUrl: newClip.thumbnailUrl,
      url: newClip.storageUrl
    };

    // Trigger background clip processing job
    try {
      const outputStorageKey = `clips/${session.user.id}/${newClip.id}/clip_${Date.now()}_${newClip.startTime}_${newClip.endTime}.mp4`;
      
      // Add clip to processing queue for actual video processing
      await addClipToProcessingQueue({
        clipId: newClip.id,
        videoStorageKey: newClip.video.storageKey!,
        outputStorageKey,
        startTime: newClip.startTime,
        endTime: newClip.endTime,
        aspectRatio: newClip.aspectRatio
      });

      console.log(`[API/CLIPS] Clip ${newClip.id} added to processing queue`);
    } catch (queueError) {
      console.error('[API/CLIPS] Error adding clip to processing queue:', queueError);
      // Update clip status to error if queue addition fails
      await prisma.clip.update({
        where: { id: newClip.id },
        data: { status: 'error' }
      });
    }

    return NextResponse.json({ data: transformedClip }, { status: 201 });
  } catch (error) {
    console.error('Error creating clip:', error);
    return NextResponse.json(
      { error: 'Failed to create clip' },
      { status: 500 }
    );
  }
}
