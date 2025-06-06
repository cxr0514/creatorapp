import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isAIAvailable } from '@/lib/ai/openai-client'
import OpenAI from 'openai'

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if AI is available
    if (!isAIAvailable()) {
      return NextResponse.json(
        { error: 'AI service is not available. Please configure OPENAI_API_KEY.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { 
      videoTitle, 
      videoDescription, 
      clipCount = 1, 
      platform = 'general', 
      existingDescription = '',
      action = 'generate' // 'generate' or 'improve'
    } = body

    if (!videoTitle) {
      return NextResponse.json(
        { error: 'Video title is required' },
        { status: 400 }
      )
    }

    if (clipCount < 1 || clipCount > 10) {
      return NextResponse.json(
        { error: 'Clip count must be between 1 and 10' },
        { status: 400 }
      )
    }

    let prompt = ''
    
    if (action === 'improve' && existingDescription) {
      prompt = `Improve this clip description to be more engaging and platform-optimized:

Original description: "${existingDescription}"
Video title: "${videoTitle}"
${videoDescription ? `Video context: "${videoDescription}"` : ''}
Platform: ${platform}

Make it more engaging, add relevant keywords, and optimize for ${platform === 'tiktok' ? 'TikTok/Instagram Reels' : platform === 'instagram' ? 'Instagram' : platform === 'twitter' ? 'Twitter/X' : 'general social media'}. Keep it concise but compelling.`
    } else {
      prompt = `Generate ${clipCount} engaging ${clipCount === 1 ? 'description' : 'descriptions'} for video clip${clipCount === 1 ? '' : 's'} based on this video:

Video Title: "${videoTitle}"
${videoDescription ? `Video Description: "${videoDescription}"` : ''}
Platform: ${platform === 'tiktok' ? 'TikTok/Instagram Reels (9:16)' : platform === 'instagram' ? 'Instagram Feed (1:1)' : platform === 'twitter' ? 'Twitter/X (16:9)' : 'General Social Media'}

Requirements:
- Each description should be 100-150 characters
- Include relevant trending keywords
- Make them engaging and clickable
- Optimize for the target platform
- Focus on hook, value, and call-to-action
${clipCount > 1 ? `- Make each description unique and appealing to different angles/audiences` : ''}

${clipCount === 1 ? 'Return just the description text.' : `Return ${clipCount} descriptions as a JSON array of strings.`}`
    }

    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media content creator who specializes in writing engaging, viral-worthy descriptions for video clips. You understand platform-specific optimization and trending content strategies.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    })

    const result = completion.choices[0]?.message?.content?.trim()

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate clip copy' },
        { status: 500 }
      )
    }

    // Parse the result
    let descriptions: string[]

    if (action === 'improve') {
      descriptions = [result]
    } else if (clipCount === 1) {
      descriptions = [result]
    } else {
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(result)
        if (Array.isArray(parsed)) {
          descriptions = parsed.slice(0, clipCount)
        } else {
          // Fallback: split by lines and clean up
          descriptions = result
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+[\.\)\-]\s*/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, clipCount)
        }
      } catch {
        // Fallback: split by lines and clean up
        descriptions = result
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+[\.\)\-]\s*/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, clipCount)
      }
    }

    // Ensure we have the right number of descriptions
    while (descriptions.length < clipCount) {
      descriptions.push(descriptions[descriptions.length - 1] || 'Engaging video clip')
    }

    return NextResponse.json({
      descriptions: descriptions.slice(0, clipCount),
      count: clipCount
    })

  } catch (error) {
    console.error('Error generating clip copy:', error)
    return NextResponse.json(
      { error: 'Failed to generate clip copy' },
      { status: 500 }
    )
  }
}
