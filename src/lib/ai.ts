import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AIMetadata {
  title?: string
  description?: string
  hashtags?: string[]
  tags?: string[]
}

interface GenerateMetadataParams {
  videoTitle?: string
  videoDuration?: number
  clipDuration?: number
  startTime?: number
  endTime?: number
  aspectRatio?: string
  existingTitle?: string
  existingDescription?: string
}

export async function generateVideoMetadata(params: GenerateMetadataParams): Promise<AIMetadata> {
  try {
    const prompt = `
Generate SEO-optimized metadata for a video with the following details:
- Title: ${params.videoTitle || 'Untitled Video'}
- Duration: ${params.videoDuration ? `${Math.floor(params.videoDuration / 60)}:${(params.videoDuration % 60).toString().padStart(2, '0')}` : 'Unknown'}
- Existing title: ${params.existingTitle || 'None'}
- Existing description: ${params.existingDescription || 'None'}

Please provide:
1. An engaging, SEO-optimized title (max 60 characters)
2. A compelling description (max 200 characters) 
3. 5-8 relevant hashtags without the # symbol
4. 5-8 searchable tags/keywords

Focus on content discovery, engagement, and searchability. Make it suitable for social media platforms.

Respond in JSON format:
{
  "title": "engaging title here",
  "description": "compelling description here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "tags": ["tag1", "tag2", "tag3"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('Error generating video metadata:', error)
    throw new Error('Failed to generate AI metadata')
  }
}

export async function generateClipMetadata(params: GenerateMetadataParams): Promise<AIMetadata> {
  try {
    const clipDuration = params.clipDuration || (params.endTime && params.startTime ? params.endTime - params.startTime : 30)
    
    const prompt = `
Generate SEO-optimized metadata for a video clip with the following details:
- Source video: ${params.videoTitle || 'Untitled Video'}
- Clip duration: ${Math.floor(clipDuration / 60)}:${(clipDuration % 60).toString().padStart(2, '0')}
- Aspect ratio: ${params.aspectRatio || '16:9'}
- Time range: ${params.startTime ? `${Math.floor(params.startTime / 60)}:${(params.startTime % 60).toString().padStart(2, '0')}` : '0:00'} - ${params.endTime ? `${Math.floor(params.endTime / 60)}:${(params.endTime % 60).toString().padStart(2, '0')}` : '0:30'}
- Existing title: ${params.existingTitle || 'None'}

Platform optimization for aspect ratio ${params.aspectRatio}:
${params.aspectRatio === '9:16' ? '- Optimized for TikTok, Instagram Reels, YouTube Shorts' : ''}
${params.aspectRatio === '1:1' ? '- Optimized for Instagram Posts, Twitter/X, LinkedIn' : ''}
${params.aspectRatio === '16:9' ? '- Optimized for YouTube, Twitter/X, LinkedIn, General Web' : ''}

Please provide:
1. An engaging, platform-optimized title (max 60 characters)
2. A compelling description (max 200 characters)
3. 5-10 relevant hashtags without the # symbol (include platform-specific trending tags)
4. 5-8 searchable tags/keywords

Focus on viral potential, engagement, and platform-specific optimization.

Respond in JSON format:
{
  "title": "engaging title here",
  "description": "compelling description here", 
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "tags": ["tag1", "tag2", "tag3"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('Error generating clip metadata:', error)
    throw new Error('Failed to generate AI metadata')
  }
}

export async function improveMetadata(currentMetadata: AIMetadata, context?: string): Promise<AIMetadata> {
  try {
    const prompt = `
Improve the following metadata to be more engaging and SEO-optimized:

Current Title: ${currentMetadata.title || 'None'}
Current Description: ${currentMetadata.description || 'None'}
Current Hashtags: ${currentMetadata.hashtags?.join(', ') || 'None'}
Current Tags: ${currentMetadata.tags?.join(', ') || 'None'}

Additional context: ${context || 'None provided'}

Please provide improved versions that are:
1. More engaging and clickable
2. Better optimized for search algorithms
3. More likely to go viral on social media
4. Include trending keywords where appropriate

Respond in JSON format:
{
  "title": "improved title here",
  "description": "improved description here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "tags": ["tag1", "tag2", "tag3"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('Error improving metadata:', error)
    throw new Error('Failed to improve metadata')
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateCaptions(audioUrl: string): Promise<string> {
  try {
    // Note: This is a placeholder for Whisper API integration
    // In a full implementation, you would:
    // 1. Download the audio from the video
    // 2. Send it to OpenAI's Whisper API
    // 3. Return the transcription in SRT or VTT format
    
    throw new Error('Caption generation not yet implemented - requires audio extraction and Whisper API integration')
  } catch (error) {
    console.error('Error generating captions:', error)
    throw new Error('Failed to generate captions')
  }
}
