// AI-powered metadata generation service
import { openai, AI_CONFIG, AIServiceError } from './openai-client';

export interface VideoMetadata {
  title?: string;
  description?: string;
  hashtags?: string[];
  categories?: string[];
  keywords?: string[];
}

export interface AIMetadataOptions {
  videoTitle?: string;
  videoDescription?: string;
  videoDuration?: number;
  contentType?: 'educational' | 'entertainment' | 'business' | 'lifestyle' | 'tech' | 'other';
  targetAudience?: 'general' | 'professional' | 'youth' | 'creators' | 'specific';
  platform?: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'linkedin' | 'all';
}

export class AIMetadataService {
  /**
   * Generate AI-powered title suggestions
   */
  static async generateTitle(
    videoDescription: string,
    options: AIMetadataOptions = {}
  ): Promise<string[]> {
    try {
      const prompt = this.buildTitlePrompt(videoDescription, options);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.text,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: AI_CONFIG.maxTokens.title,
        temperature: AI_CONFIG.temperature,
        n: 3, // Generate 3 title options
      });

      const titles = response.choices
        .map(choice => choice.message?.content?.trim())
        .filter(Boolean) as string[];

      return titles.length > 0 ? titles : ['Generated Title'];
    } catch (error) {
      console.error('AI title generation failed:', error);
      throw new AIServiceError('Failed to generate AI titles');
    }
  }

  /**
   * Generate AI-powered description
   */
  static async generateDescription(
    videoTitle: string,
    videoDescription: string,
    options: AIMetadataOptions = {}
  ): Promise<string> {
    try {
      const prompt = this.buildDescriptionPrompt(videoTitle, videoDescription, options);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.text,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: AI_CONFIG.maxTokens.description,
        temperature: AI_CONFIG.temperature,
      });

      return response.choices[0]?.message?.content?.trim() || 'AI-generated description';
    } catch (error) {
      console.error('AI description generation failed:', error);
      throw new AIServiceError('Failed to generate AI description');
    }
  }

  /**
   * Generate SEO-optimized hashtags
   */
  static async generateHashtags(
    videoTitle: string,
    videoDescription: string,
    options: AIMetadataOptions = {}
  ): Promise<string[]> {
    try {
      const prompt = this.buildHashtagPrompt(videoTitle, videoDescription, options);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.text,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: AI_CONFIG.maxTokens.hashtags,
        temperature: 0.5, // Lower temperature for more consistent hashtags
      });

      const hashtagText = response.choices[0]?.message?.content?.trim() || '';
      const hashtags = this.parseHashtags(hashtagText);
      
      return hashtags;
    } catch (error) {
      console.error('AI hashtag generation failed:', error);
      throw new AIServiceError('Failed to generate AI hashtags');
    }
  }

  /**
   * Generate content categories and tags
   */
  static async generateCategories(
    videoTitle: string,
    videoDescription: string,
    options: AIMetadataOptions = {}
  ): Promise<{ categories: string[]; keywords: string[] }> {
    try {
      const prompt = this.buildCategoriesPrompt(videoTitle, videoDescription, options);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.models.analysis,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: AI_CONFIG.maxTokens.categories,
        temperature: 0.3, // Lower temperature for consistent categorization
      });

      const result = response.choices[0]?.message?.content?.trim() || '';
      return this.parseCategories(result);
    } catch (error) {
      console.error('AI categorization failed:', error);
      throw new AIServiceError('Failed to generate AI categories');
    }
  }

  /**
   * Generate complete metadata package
   */
  static async generateCompleteMetadata(
    videoTitle: string,
    videoDescription: string,
    options: AIMetadataOptions = {}
  ): Promise<VideoMetadata> {
    try {
      const [titles, description, hashtags, categorization] = await Promise.all([
        this.generateTitle(videoDescription, options),
        this.generateDescription(videoTitle, videoDescription, options),
        this.generateHashtags(videoTitle, videoDescription, options),
        this.generateCategories(videoTitle, videoDescription, options),
      ]);

      return {
        title: titles[0], // Use the first generated title
        description,
        hashtags,
        categories: categorization.categories,
        keywords: categorization.keywords,
      };
    } catch (error) {
      console.error('Complete metadata generation failed:', error);
      throw new AIServiceError('Failed to generate complete metadata');
    }
  }

  // Private helper methods

  private static buildTitlePrompt(videoDescription: string, options: AIMetadataOptions): string {
    const platform = options.platform || 'all';
    const contentType = options.contentType || 'general';
    
    return `Generate 3 engaging, SEO-optimized video titles based on this description:

"${videoDescription}"

Requirements:
- Platform focus: ${platform}
- Content type: ${contentType}
- Target audience: ${options.targetAudience || 'general'}
- Length: 50-80 characters each
- Include relevant keywords
- Make them click-worthy but not clickbait
- Format: Return only the titles, one per line

Examples of good titles:
- "How to Master [Skill] in 10 Minutes (Beginner-Friendly)"
- "The Secret [Topic] Strategy That Changed Everything"
- "5 [Topic] Mistakes Everyone Makes (And How to Fix Them)"`;
  }

  private static buildDescriptionPrompt(
    videoTitle: string,
    videoDescription: string,
    options: AIMetadataOptions
  ): string {
    const platform = options.platform || 'all';
    
    return `Create an engaging, SEO-optimized video description based on:

Title: "${videoTitle}"
Original Description: "${videoDescription}"

Requirements:
- Platform: ${platform}
- Length: 150-300 words
- Include a compelling hook in the first 2 lines
- Add relevant keywords naturally
- Include a call-to-action
- Make it scannable with bullet points or short paragraphs
- Professional but engaging tone

Structure:
1. Hook (what viewers will learn/get)
2. Key points or benefits
3. Call-to-action (like, subscribe, comment)

Do not include hashtags in the description.`;
  }

  private static buildHashtagPrompt(
    videoTitle: string,
    videoDescription: string,
    options: AIMetadataOptions
  ): string {
    const platform = options.platform || 'all';
    
    return `Generate relevant hashtags for this video:

Title: "${videoTitle}"
Description: "${videoDescription}"
Platform: ${platform}

Requirements:
- 8-15 hashtags total
- Mix of popular and niche tags
- Include platform-specific trending tags
- No spaces in hashtags
- Return format: #hashtag1 #hashtag2 #hashtag3...

Categories to include:
- Main topic hashtags (2-3)
- Broad category hashtags (2-3)
- Platform-specific hashtags (1-2)
- Trending/popular hashtags (2-3)
- Niche/specific hashtags (2-4)`;
  }

  private static buildCategoriesPrompt(
    videoTitle: string,
    videoDescription: string,
    options: AIMetadataOptions
  ): string {
    return `Analyze this video content and categorize it:

Title: "${videoTitle}"
Description: "${videoDescription}"

Return ONLY a JSON object with this exact format:
{
  "categories": ["category1", "category2", "category3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Categories should be:
- 2-4 broad categories (e.g., "Education", "Technology", "Business", "Entertainment")
- Use standard content categories

Keywords should be:
- 3-8 specific, searchable terms
- Single words or short phrases
- Relevant for SEO and discovery`;
  }

  private static parseHashtags(hashtagText: string): string[] {
    const hashtags = hashtagText
      .split(/\s+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.replace('#', '').toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 15); // Limit to 15 hashtags

    return hashtags;
  }

  private static parseCategories(categoriesText: string): { categories: string[]; keywords: string[] } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(categoriesText);
      return {
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      };
    } catch {
      // Fallback parsing if JSON fails
      return {
        categories: ['General'],
        keywords: ['video', 'content'],
      };
    }
  }
}
