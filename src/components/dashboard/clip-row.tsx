'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, AlertTriangle, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import VideoPreviewPlayer from "./video-preview-player";

interface ClipSegment {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  duration: number;
  title?: string;
  description?: string;
  hashtags?: string;
  hasOverlap?: boolean;
}

interface ClipRowProps {
  clip: ClipSegment;
  videoUrl: string;
  videoDuration: number;
  onUpdateClip: (clipId: string, updates: Partial<ClipSegment>) => void;
  onSeekToStart?: (clip: ClipSegment) => void;
  onPlayPreview?: (clip: ClipSegment) => void;
  isPlaying?: boolean;
}

export function ClipRow({
  clip,
  videoUrl,
  videoDuration,
  onUpdateClip,
  onSeekToStart,
  onPlayPreview,
  isPlaying = false
}: ClipRowProps) {
  const hasOverlap = clip.hasOverlap;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (values: number[]) => {
    if (values.length === 2) {
      const [start, end] = values;
      onUpdateClip(clip.id, { startTime: start, endTime: end });
    }
  };

  const handleTimeInputChange = (field: 'startTime' | 'endTime', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= videoDuration) {
      onUpdateClip(clip.id, { [field]: numValue });
    }
  };

  return (
    <Card className={cn(
      "relative",
      hasOverlap && "border-yellow-500 bg-yellow-50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            {clip.label}
            <Badge variant={hasOverlap ? "destructive" : "secondary"}>
              {formatTime(clip.duration)}
            </Badge>
          </CardTitle>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSeekToStart?.(clip)}
              className="h-6 w-6 p-0"
              title="Seek to clip start"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPlayPreview?.(clip)}
              className="h-6 w-6 p-0"
              title="Preview clip"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {hasOverlap && (
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Overlaps with another clip
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Video Preview Player */}
        <div className="w-full">
          <VideoPreviewPlayer
            src={videoUrl}
            clipStart={clip.startTime}
            clipEnd={clip.endTime}
            className="h-48 rounded-lg overflow-hidden"
            onTimeUpdate={() => {
              // Optional: Handle time updates for this specific clip
            }}
          />
        </div>

        {/* Timeline Slider */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Start: {formatTime(clip.startTime)}</span>
            <span>End: {formatTime(clip.endTime)}</span>
          </div>
          <Slider
            min={0}
            max={videoDuration}
            step={0.1}
            value={[clip.startTime, clip.endTime]}
            onValueChange={handleSliderChange}
            className="w-full"
            disabled={videoDuration === 0}
          />
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`start-${clip.id}`} className="text-xs">Start (s)</Label>
            <Input
              id={`start-${clip.id}`}
              type="number"
              min={0}
              max={videoDuration}
              step={0.1}
              value={clip.startTime.toFixed(1)}
              onChange={(e) => handleTimeInputChange('startTime', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`end-${clip.id}`} className="text-xs">End (s)</Label>
            <Input
              id={`end-${clip.id}`}
              type="number"
              min={0}
              max={videoDuration}
              step={0.1}
              value={clip.endTime.toFixed(1)}
              onChange={(e) => handleTimeInputChange('endTime', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Clip-specific metadata */}
        <div className="grid grid-cols-1 gap-2">
          <Input
            placeholder={`Title for ${clip.label}`}
            value={clip.title || ''}
            onChange={(e) => onUpdateClip(clip.id, { title: e.target.value })}
            className="h-8 text-xs"
          />
          <Input
            placeholder={`Description for ${clip.label}`}
            value={clip.description || ''}
            onChange={(e) => onUpdateClip(clip.id, { description: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
