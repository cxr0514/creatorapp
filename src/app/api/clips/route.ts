import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

interface Clip {
  id: number;
  title: string;
  description?: string;
  hashtags?: string[];
  startTime: number;
  endTime: number;
  aspectRatio: string;
  platform: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
  video: {
    id: number;
    title: string;
    filename: string;
  };
  thumbnailUrl?: string;
  url?: string;
}

// Mock implementation - replace with actual database operations
const mockClips: Clip[] = [];
let nextClipId = 1;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    // Filter clips by videoId if provided
    const filteredClips = videoId 
      ? mockClips.filter(clip => clip.video.id === parseInt(videoId))
      : mockClips;

    return NextResponse.json({ data: filteredClips });
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
    const requestData = (await request.json()) as CreateClipRequest;
    
    if (!requestData.originalVideoId || !requestData.title) {
      return NextResponse.json(
        { error: 'originalVideoId and title are required' }, 
        { status: 400 }
      );
    }

    // Mock clip creation - replace with actual database operation
    const newClip: Clip = {
      id: nextClipId++,
      title: requestData.title,
      description: requestData.description,
      hashtags: requestData.hashtags ? requestData.hashtags.split(',').map(tag => tag.trim()) : [],
      startTime: requestData.startTime,
      endTime: requestData.endTime,
      aspectRatio: requestData.aspectRatio,
      platform: requestData.platform,
      status: 'processing',
      createdAt: new Date().toISOString(),
      video: {
        id: parseInt(requestData.originalVideoId),
        title: `Source Video ${requestData.originalVideoId}`,
        filename: `video_${requestData.originalVideoId}.mp4`
      },
      thumbnailUrl: `https://picsum.photos/seed/clip_${nextClipId}/300/200`,
      url: `clips/${requestData.originalVideoId}/clip_${Date.now()}_${requestData.originalVideoId}_${requestData.startTime}_${requestData.endTime}.mp4`
    };

    mockClips.push(newClip);

    // Simulate processing delay
    setTimeout(() => {
      const clipIndex = mockClips.findIndex(clip => clip.id === newClip.id);
      if (clipIndex !== -1) {
        mockClips[clipIndex].status = 'ready';
      }
    }, 2000);

    return NextResponse.json({ data: newClip }, { status: 201 });

  } catch (error) {
    console.error('Error creating clip:', error);
    return NextResponse.json(
      { error: 'Failed to create clip' },
      { status: 500 }
    );
  }
}
