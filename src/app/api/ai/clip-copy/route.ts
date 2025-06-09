import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ClipCopyRequest {
  videoContext: string;
  targetAudience?: string;
  platform?: string;
  tone?: string;
  clipCount?: number;
}

interface ClipCopyResponse {
  titles: string[];
  descriptions: string[];
  hashtags: string[];
  ideas: string[];
}

// Mock AI implementation - replace with actual AI service integration
async function generateClipCopy(request: ClipCopyRequest): Promise<ClipCopyResponse> {
  const { clipCount = 1, platform = 'general' } = request;
  
  // Mock titles based on clip count
  const mockTitles = [
    "🔥 This moment will blow your mind!",
    "✨ You won't believe what happens next",
    "💯 The best part of the entire video",
    "🚀 This changed everything for me",
    "⚡ Watch this incredible transformation",
    "🎯 The secret nobody talks about",
    "🌟 This will inspire you instantly",
    "🔥 Pure gold in 60 seconds",
    "💎 The highlight everyone's sharing",
    "🎬 Cinema-worthy moment right here"
  ];

  // Mock descriptions based on platform and tone
  const mockDescriptions = [
    "This incredible moment showcases exactly why this content resonates with so many people. The authenticity and raw emotion captured here is what makes great content.",
    "Breaking down the most important insights from this video - this clip contains the key takeaway that everyone needs to hear right now.",
    "The energy in this segment is absolutely infectious! You can feel the passion and dedication that went into creating this moment.",
    "This is the type of content that stops your scroll. Every second is packed with value and entertainment that keeps you watching.",
    "Watch how this unfolds - it's a perfect example of storytelling at its finest. The way this moment builds is simply masterful.",
    "The genuine reaction captured here is why authentic content always wins. This is real, unfiltered, and absolutely captivating.",
    "This segment perfectly encapsulates the main message. If you watch nothing else, make sure you see this part.",
    "The transformation happening in this clip is remarkable. You can literally see the moment everything clicks into place.",
    "This is the kind of content that gets shared thousands of times. The relatability factor is off the charts.",
    "Pure inspiration condensed into the perfect bite-sized format. This is what quality content looks like."
  ];

  // Mock hashtags based on platform
  const platformHashtags = {
    tiktok: ["#fyp", "#viral", "#trending", "#foryou", "#amazing", "#mindblown", "#mustsee"],
    instagram_reels: ["#reels", "#explore", "#viral", "#trending", "#amazing", "#inspiration"],
    youtube_shorts: ["#shorts", "#viral", "#trending", "#youtube", "#amazing", "#subscribe"],
    general: ["#viral", "#trending", "#amazing", "#mustsee", "#inspiration", "#quality"]
  };

  const baseHashtags = platformHashtags[platform as keyof typeof platformHashtags] || platformHashtags.general;
  
  // Mock ideas for content creators
  const mockIdeas = [
    "Create a reaction video to this moment",
    "Use this as a hook for a longer-form tutorial",
    "Turn this into a series exploring similar concepts",
    "Create a behind-the-scenes breakdown",
    "Use this format for other topics in your niche"
  ];

  return {
    titles: mockTitles.slice(0, clipCount),
    descriptions: mockDescriptions.slice(0, clipCount),
    hashtags: baseHashtags,
    ideas: mockIdeas.slice(0, Math.min(clipCount, 3))
  };
}

export async function POST(request: NextRequest) {
  try {
    const requestData = (await request.json()) as ClipCopyRequest;

    if (!requestData.videoContext) {
      return NextResponse.json({ error: 'videoContext is required' }, { status: 400 });
    }

    const responseData = await generateClipCopy(requestData);
    return NextResponse.json({ data: responseData });

  } catch (error) {
    console.error('Error generating clip copy:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI clip copy' },
      { status: 500 }
    );
  }
}
