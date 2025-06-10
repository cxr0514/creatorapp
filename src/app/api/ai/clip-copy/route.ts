import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AIMetadataService } from '@/lib/ai/metadata-service';

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

// AI-powered implementation using OpenAI
async function generateClipCopy(request: ClipCopyRequest): Promise<ClipCopyResponse> {
  const { 
    videoContext, 
    targetAudience = 'general', 
    platform = 'general',
    tone = 'engaging',
    clipCount = 1 
  } = request;

  try {
    // Map platform to valid AI metadata platform
    const aiPlatform = mapPlatformToAI(platform);
    const aiAudience = mapAudienceToAI(targetAudience);

    // Use AI to generate titles based on video context
    const titles = await AIMetadataService.generateTitle(
      `Video content: ${videoContext}. Generate engaging clip titles for ${platform} platform with ${tone} tone for ${targetAudience} audience.`,
      {
        platform: aiPlatform,
        targetAudience: aiAudience,
        contentType: 'entertainment'
      }
    );

    // Generate descriptions for each title
    const descriptions: string[] = [];
    for (let i = 0; i < Math.min(clipCount, titles.length); i++) {
      const description = await AIMetadataService.generateDescription(
        titles[i],
        `Video content: ${videoContext}. Create engaging description for ${platform} platform with ${tone} tone.`,
        {
          platform: aiPlatform,
          targetAudience: aiAudience,
          contentType: 'entertainment'
        }
      );
      descriptions.push(description);
    }

    // Generate hashtags
    const hashtags = await AIMetadataService.generateHashtags(
      titles[0] || 'Engaging Content',
      `Video content: ${videoContext}`,
      {
        platform: aiPlatform,
        targetAudience: aiAudience
      }
    );

    // Generate content ideas using AI
    const ideaPrompt = `Based on this video content: "${videoContext}", suggest 3-5 creative content ideas for follow-up videos or ways to repurpose this content for ${platform}. Focus on ${tone} tone for ${targetAudience} audience.`;
    const ideaResponse = await AIMetadataService.generateTitle(ideaPrompt, {
      platform: aiPlatform,
      targetAudience: aiAudience
    });

    return {
      titles: titles.slice(0, clipCount),
      descriptions: descriptions,
      hashtags: hashtags,
      ideas: ideaResponse.slice(0, Math.min(clipCount, 5))
    };

  } catch (error) {
    console.error('AI generation failed, falling back to enhanced suggestions:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Fallback to enhanced contextual suggestions if AI fails
    return generateEnhancedFallback(request);
  }
}

// Helper functions to map request types to AI service types
function mapPlatformToAI(platform: string): 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin' | 'all' {
  const platformMap: Record<string, 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin' | 'all'> = {
    'youtube_shorts': 'youtube',
    'instagram_reels': 'instagram',
    'tiktok': 'tiktok',
    'twitter': 'twitter',
    'linkedin': 'linkedin',
    'general': 'all'
  };
  return platformMap[platform] || 'all';
}

function mapAudienceToAI(audience: string): 'general' | 'professional' | 'youth' | 'creators' | 'specific' {
  const audienceMap: Record<string, 'general' | 'professional' | 'youth' | 'creators' | 'specific'> = {
    'general': 'general',
    'professional': 'professional',
    'youth': 'youth',
    'creators': 'creators',
    'specific': 'specific'
  };
  return audienceMap[audience] || 'general';
}

// Enhanced fallback with better contextual suggestions
function generateEnhancedFallback(request: ClipCopyRequest): ClipCopyResponse {
  const { videoContext, platform = 'general', tone = 'engaging', clipCount = 1 } = request;
  
  // Generate contextual titles based on video content
  const contextKeywords = extractKeywords(videoContext);
  const enhancedTitles = generateContextualTitles(contextKeywords, tone);
  
  // Generate contextual descriptions
  const enhancedDescriptions = generateContextualDescriptions(videoContext);
  
  // Platform-specific hashtags
  const platformHashtags = {
    tiktok: ["#fyp", "#viral", "#trending", "#foryou", "#amazing", "#mindblown", "#mustsee"],
    instagram_reels: ["#reels", "#explore", "#viral", "#trending", "#amazing", "#inspiration"],
    youtube_shorts: ["#shorts", "#viral", "#trending", "#youtube", "#amazing", "#subscribe"],
    general: ["#viral", "#trending", "#amazing", "#mustsee", "#inspiration", "#quality"]
  };

  const baseHashtags = platformHashtags[platform as keyof typeof platformHashtags] || platformHashtags.general;
  
  // Contextual content ideas
  const contextualIdeas = generateContextualIdeas();

  return {
    titles: enhancedTitles.slice(0, clipCount),
    descriptions: enhancedDescriptions.slice(0, clipCount),
    hashtags: baseHashtags,
    ideas: contextualIdeas.slice(0, Math.min(clipCount, 3))
  };
}

// Helper functions for enhanced fallback
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  return words.filter(word => word.length > 3 && !stopWords.has(word)).slice(0, 5);
}

function generateContextualTitles(keywords: string[], tone: string): string[] {
  const toneEmojis = {
    engaging: "🔥✨💯🚀⚡",
    professional: "📈💼🎯📊✅",
    casual: "😊👍🎉💕🌟",
    educational: "📚💡🧠🎓✍️"
  };
  
  const emojis = toneEmojis[tone as keyof typeof toneEmojis] || toneEmojis.engaging;
  const emojiArray = emojis.split('');
  
  return [
    `${emojiArray[0]} ${keywords[0] ? keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1) : 'Amazing'} moment that changes everything`,
    `${emojiArray[1]} You need to see this ${keywords[1] || 'incredible'} transformation`,
    `${emojiArray[2]} The ${keywords[0] || 'best'} part everyone's talking about`,
    `${emojiArray[3]} This ${keywords[1] || 'amazing'} discovery will inspire you`,
    `${emojiArray[4]} Watch this ${keywords[0] || 'incredible'} moment unfold`
  ];
}

function generateContextualDescriptions(context: string): string[] {
  const contextSnippet = context.substring(0, 100);
  
  return [
    `This incredible moment showcases the essence of what makes content truly engaging. ${contextSnippet.length < 100 ? context : contextSnippet + '...'} The authenticity captured here resonates with audiences everywhere.`,
    `Breaking down the key insights from this powerful segment. This content demonstrates exactly why genuine moments create the most impact and drive real engagement.`,
    `The energy and passion in this clip is absolutely infectious. Every second delivers value while maintaining the perfect balance of entertainment and substance.`,
    `This is the type of content that stops your scroll and demands attention. The storytelling and execution here represents content creation at its finest.`
  ];
}

function generateContextualIdeas(): string[] {
  const baseIdeas = [
    "Create a detailed breakdown tutorial",
    "Film a behind-the-scenes reaction", 
    "Turn this into a series format",
    "Create companion content for other platforms",
    "Develop follow-up content addressing audience questions"
  ];
  
  return baseIdeas;
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
