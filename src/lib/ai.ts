import OpenAI from 'openai'
import { extractAudioFromVideo } from './video/audio-extractor'

// Initialize OpenAI client only when API key is available
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for AI features')
  }
  return new OpenAI({ apiKey })
}

// Time format for captions/subtitles
const formatTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

interface AIMetadata {
  title?: string
  description?: string
  hashtags?: string[]
  tags?: string[]
}

interface GenerateMetadataParams {
  videoTitle?: string
  videoDuration?: number
  startTime?: number
  endTime?: number
  aspectRatio?: string
  existingTitle?: string
  existingDescription?: string
}

interface CaptionSegment {
  id: number
  start: number
  end: number
  text: string
}

interface CaptionOptions {
  format?: 'srt' | 'vtt'
  language?: string
  startTime?: number
  duration?: number
}

// Convert captions to SRT format
function formatSRT(segments: CaptionSegment[]): string {
  return segments.map(segment => {
    return `${segment.id}\n${formatTimestamp(segment.start)} --> ${formatTimestamp(segment.end)}\n${segment.text}\n\n`
  }).join('')
}

// Convert captions to WebVTT format
function formatVTT(segments: CaptionSegment[]): string {
  return `WEBVTT\n\n${segments.map(segment => {
    return `${segment.id}\n${formatTimestamp(segment.start).replace(',', '.')} --> ${formatTimestamp(segment.end).replace(',', '.')}\n${segment.text}\n\n`
  }).join('')}`
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

    const openai = getOpenAIClient()
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

    const openai = getOpenAIClient()
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

export async function generateCaptions(audioUrl: string, options: CaptionOptions = {}): Promise<string> {
  try {
    // Extract audio from video URL
    const audioFile = await extractAudioFromVideo(audioUrl, {
      format: 'mp3',
      startTime: options.startTime,
      duration: options.duration
    })

    // Send to Whisper API
    const openai = getOpenAIClient()
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      language: options.language,
      timestamp_granularities: ['segment']
    }) as OpenAI.Audio.Transcription & {
      segments?: {
        start: number
        end: number
        text: string
      }[]
    }

    if (!transcription.segments || transcription.segments.length === 0) {
      throw new Error('No caption segments were generated')
    }

    // Offset timestamps if startTime was specified
    const segments = transcription.segments.map((segment, index) => ({
      id: index + 1,
      start: segment.start + (options.startTime || 0),
      end: segment.end + (options.startTime || 0),
      text: segment.text.trim()
    }))

    // Return formatted captions
    return options.format === 'vtt' ? formatVTT(segments) : formatSRT(segments)

  } catch (error) {
    console.error('Error generating captions:', error)
    throw new Error('Failed to generate captions')
  }
}
