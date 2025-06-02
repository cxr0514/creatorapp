'use client';

import React, { useState, useEffect } from 'react';
import { AISuggestionRequest, RepurposingSuggestion } from '@/types/suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wand2, Check, PlusCircle } from 'lucide-react'; // Added Wand2, Check, PlusCircle

interface AISuggestionListProps {
  videoId: number;
  clipId?: number;
  onSuggestionSelect?: (suggestion: RepurposingSuggestion) => void; // Callback when a suggestion is chosen to be created
}

const AISuggestionList: React.FC<AISuggestionListProps> = ({ videoId, clipId, onSuggestionSelect }) => {
  const [suggestions, setSuggestions] = useState<RepurposingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const requestBody: AISuggestionRequest = { videoId, clipId, maxSuggestions: 5 };
        const response = await fetch('/api/ai/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch suggestions');
        }
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setSuggestions([]); // Clear previous suggestions on error
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchSuggestions();
    }
  }, [videoId, clipId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 space-x-2"><Wand2 className="w-5 h-5 animate-pulse"/> <p>Generating AI suggestions...</p></div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-red-600"><AlertCircle className="w-10 h-10 mb-2"/><p className="text-center">Error fetching suggestions: {error}</p></div>
    );
  }

  if (suggestions.length === 0) {
    return <p className="text-center text-gray-500 p-6">No AI suggestions available for this video yet.</p>;
  }

  return (
    <div className="space-y-4 p-1">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              {suggestion.suggestedTitle}
              <Badge variant={suggestion.score > 0.85 ? 'default' : 'secondary'} className="ml-2">
                {suggestion.score > 0.85 ? 'Hot 🔥' : suggestion.score > 0.7 ? 'Good ✨' : 'Idea'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">{suggestion.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Format: <strong>{suggestion.suggestedFormat}</strong></span>
              {suggestion.suggestedPlatform && <span>Platform: <Badge variant="outline">{suggestion.suggestedPlatform}</Badge></span>}
            </div>
            <div className="text-xs text-gray-600">
              Segment: {suggestion.startTime.toFixed(1)}s - {suggestion.endTime.toFixed(1)}s
              (Duration: {(suggestion.endTime - suggestion.startTime).toFixed(1)}s)
            </div>
            {suggestion.trendingAudioId && (
              <p className="text-xs text-purple-600">Trending Audio: {suggestion.trendingAudioId}</p>
            )}
          </CardContent>
          {onSuggestionSelect && (
            <CardFooter>
              <Button 
                size="sm" 
                className="w-full" 
                onClick={() => onSuggestionSelect(suggestion)}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create this Clip
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};

export default AISuggestionList; 