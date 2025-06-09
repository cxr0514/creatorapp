export interface SourceVideoAnalysis {
  videoId: number;
  duration: number;
  keyMoments: Array<{ startTime: number; endTime: number; description: string; score: number }>;
  // Add other analysis metrics as needed, e.g., speech-to-text, visual elements, audio analysis
}

export interface RepurposingSuggestion {
  id: string;
  sourceVideoId: number;
  suggestedTitle: string;
  description: string; // Why this suggestion is relevant
  suggestedFormat: string; // e.g., '9:16', '1:1'
  suggestedPlatform?: string; // e.g., 'tiktok', 'instagram-reels'
  startTime: number;
  endTime: number;
  previewThumbnailUrl?: string; // URL to a generated preview or relevant frame
  trendingAudioId?: string; // If suggesting based on trending audio
  styleReferenceId?: string; // If suggesting based on a visual style
  creationPrompt?: string; // Pre-filled prompt for AI editing if applicable
  score: number; // Confidence or relevance score
}

export interface AISuggestionRequest {
  videoId: number;
  targetPlatforms?: string[];
  desiredFormats?: string[];
  maxSuggestions?: number;
  // Potentially user preferences for suggestion types
}

export interface AISuggestionResponse {
  analysis?: SourceVideoAnalysis;
  suggestions: RepurposingSuggestion[];
} 