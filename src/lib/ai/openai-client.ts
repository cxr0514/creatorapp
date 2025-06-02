// OpenAI client configuration and initialization
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate API key exists
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. AI features will be disabled.');
}

export { openai };

// AI service configuration
export const AI_CONFIG = {
  models: {
    text: 'gpt-4o-mini', // Cost-effective model for text generation
    analysis: 'gpt-4o-mini', // For content analysis
  },
  maxTokens: {
    title: 100,
    description: 500,
    hashtags: 200,
    categories: 100,
  },
  temperature: 0.7, // Balance between creativity and consistency
};

// Error handling for AI operations
export class AIServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// Check if AI features are available
export function isAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
