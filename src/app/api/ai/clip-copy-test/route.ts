// Custom OpenAI implementation using fetch (which should work like curl)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ClipCopyRequest {
  title: string;
  description: string;
  videoContext: string;
  platform?: string;
  targetAudience?: string;
  tone?: string;
  clipCount?: number;
}

interface ClipCopyResponse {
  titles: string[];
  descriptions: string[];
  hashtags: string[];
  ideas: string[];
}

// Custom fetch-based OpenAI client to bypass connection issues
async function generateWithCustomOpenAI(request: ClipCopyRequest): Promise<ClipCopyResponse> {
  const { videoContext, platform = 'general', tone = 'engaging', clipCount = 1 } = request;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  console.log('🧪 Testing custom OpenAI fetch implementation...');

  try {
    // Generate titles
    const titlePrompt = `Generate ${clipCount} catchy, viral ${tone} titles for a ${platform} video about: "${videoContext}". Make them engaging and clickable. Return only the titles, one per line.`;
    
    const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a viral content creator. Generate engaging titles.' },
          { role: 'user', content: titlePrompt }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!titleResponse.ok) {
      const errorText = await titleResponse.text();
      console.error('❌ OpenAI API Error:', titleResponse.status, errorText);
      throw new Error(`OpenAI API error: ${titleResponse.status} - ${errorText}`);
    }

    const titleData = await titleResponse.json();
    console.log('✅ OpenAI Title Response:', titleData);
    
    const titles = titleData.choices[0]?.message?.content
      ?.split('\n')
      .filter(Boolean)
      .map((t: string) => t.replace(/^\d+\.\s*/, '').trim())
      .slice(0, clipCount) || ['Generated Title'];

    // Generate description
    const descPrompt = `Create a compelling ${tone} description for a ${platform} video about: "${videoContext}". Keep it engaging and under 150 characters.`;
    
    const descResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a social media expert. Create engaging descriptions.' },
          { role: 'user', content: descPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const descData = await descResponse.json();
    const description = descData.choices[0]?.message?.content?.trim() || 'AI-generated description';

    // Generate hashtags
    const hashtagPrompt = `Generate 7-10 relevant hashtags for a ${platform} video about: "${videoContext}". Include popular platform-specific hashtags. Return only hashtags separated by spaces.`;
    
    const hashtagResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a hashtag expert. Generate relevant hashtags.' },
          { role: 'user', content: hashtagPrompt }
        ],
        max_tokens: 100,
        temperature: 0.5,
      }),
    });

    const hashtagData = await hashtagResponse.json();
    const hashtagText = hashtagData.choices[0]?.message?.content || '';
    const hashtags = hashtagText.split(/\s+/).filter(tag => tag.startsWith('#')).slice(0, 10);

    // Generate ideas
    const ideaPrompt = `Suggest 3 creative follow-up content ideas based on: "${videoContext}". Focus on ${tone} content for ${platform}.`;
    
    const ideaResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a content strategist. Suggest creative content ideas.' },
          { role: 'user', content: ideaPrompt }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    const ideaData = await ideaResponse.json();
    const ideaText = ideaData.choices[0]?.message?.content || '';
    const ideas = ideaText.split('\n').filter(Boolean).map(idea => idea.replace(/^\d+\.\s*/, '').trim()).slice(0, 3);

    console.log('🎉 Custom OpenAI implementation successful!');
    
    return {
      titles,
      descriptions: [description],
      hashtags: hashtags.length > 0 ? hashtags : ['#viral', '#trending', '#amazing'],
      ideas: ideas.length > 0 ? ideas : ['Create a tutorial version', 'Make a behind-the-scenes video', 'Share tips and tricks']
    };

  } catch (error) {
    console.error('❌ Custom OpenAI implementation failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Clip-copy request received:', body);

    const result = await generateWithCustomOpenAI(body);
    console.log('✅ Successfully generated clip copy with custom implementation');

    return NextResponse.json({
      success: true,
      data: result,
      generated_at: new Date().toISOString(),
      method: 'custom_fetch'
    });

  } catch (error) {
    console.error('❌ Custom clip-copy generation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback_used: true
      },
      { status: 500 }
    );
  }
}
