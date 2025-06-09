import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AISuggestionRequest, AISuggestionResponse, RepurposingSuggestion, SourceVideoAnalysis } from '@/types/suggestions';

// Mock implementation - replace with actual AI suggestion logic
async function generateMockSuggestions(requestData: AISuggestionRequest): Promise<AISuggestionResponse> {
  const { videoId, maxSuggestions = 3 } = requestData;

  const mockKeyMoments = [
    { startTime: 10, endTime: 25, description: 'Key talking point 1', score: 0.9 },
    { startTime: 45, endTime: 60, description: 'Visually interesting segment', score: 0.85 },
    { startTime: 70, endTime: 75, description: 'Strong call to action', score: 0.92 },
  ];

  const analysis: SourceVideoAnalysis = {
    videoId: videoId,
    duration: 120, // Mock duration
    keyMoments: mockKeyMoments.slice(0, 2)
  };

  const suggestions: RepurposingSuggestion[] = [];
  const baseTitle = `Video ${videoId} - Repurposed`;

  for (let i = 0; i < maxSuggestions; i++) {
    const moment = mockKeyMoments[i % mockKeyMoments.length];
    suggestions.push({
      id: `sugg-${videoId}-${Date.now()}-${i}`,
      sourceVideoId: videoId,
      suggestedTitle: `${baseTitle} - Idea ${i + 1} (${moment.description.substring(0,15)}...)`,
      description: `This segment from ${moment.startTime}s to ${moment.endTime}s features a ${moment.description.toLowerCase()} and could be great for a short teaser.`,
      suggestedFormat: i % 2 === 0 ? '9:16' : '1:1',
      suggestedPlatform: i % 2 === 0 ? 'tiktok' : 'instagram-posts',
      startTime: moment.startTime,
      endTime: moment.endTime,
      score: moment.score - (i * 0.05), // Slightly vary score
      previewThumbnailUrl: `https://picsum.photos/seed/${videoId}_${i}/200/100` // Placeholder image
    });
  }

  return { analysis, suggestions };
}

export async function POST(request: NextRequest) {
  try {
    const requestData = (await request.json()) as AISuggestionRequest;

    if (!requestData.videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const responseData = await generateMockSuggestions(requestData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[AI_SUGGESTIONS_API_ERROR]', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Failed to get AI suggestions', details: errorMessage }, { status: 500 });
  }
} 