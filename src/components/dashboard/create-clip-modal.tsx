'use client'

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import VideoJSPlayer from "./video-js-player"; 
import "video.js/dist/video-js.css";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Play, Pause, RotateCcw, AlertTriangle, GripVertical, Grid3X3, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

interface CreateClipModalProps {
  videoId: string;
  videoUrl: string;
  videoDuration: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClipsCreated?: () => void;
}

const platformOptions = [
  { name: "TikTok", value: "tiktok", aspectRatio: "9:16" },
  { name: "Instagram Reels", value: "instagram_reels", aspectRatio: "9:16" },
  { name: "YouTube Shorts", value: "youtube_shorts", aspectRatio: "9:16" },
  { name: "Instagram Post (1:1)", value: "instagram_feed_square", aspectRatio: "1:1" },
  { name: "Instagram Post (4:5)", value: "instagram_feed_vertical", aspectRatio: "4:5" },
  { name: "X / Twitter (16:9)", value: "x_twitter_landscape", aspectRatio: "16:9" },
  { name: "X / Twitter (1:1)", value: "x_twitter_square", aspectRatio: "1:1" },
];

export function CreateClipModal({
  videoId,
  videoUrl,
  videoDuration: initialVideoDuration,
  isOpen,
  onOpenChange,
  onClipsCreated,
}: CreateClipModalProps) {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [clipCount, setClipCount] = useState<string>("1");
  const [platform, setPlatform] = useState<string>(platformOptions[0].value);
  const [allowOverlap, setAllowOverlap] = useState(true);
  
  // Simple mode state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [videoDuration, setVideoDuration] = useState(initialVideoDuration || 0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(initialVideoDuration || 60, 60));
  
  // Advanced mode state
  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [globalTitle, setGlobalTitle] = useState("");
  const [globalDescription, setGlobalDescription] = useState("");
  const [globalHashtags, setGlobalHashtags] = useState("");
  
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isCreatingClips, setIsCreatingClips] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoPlayerKey, setVideoPlayerKey] = useState(Date.now());
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Switch to advanced mode when clip count > 1
  useEffect(() => {
    const count = parseInt(clipCount, 10);
    if (count > 1 && mode === 'simple') {
      setMode('advanced');
    } else if (count === 1 && mode === 'advanced') {
      setMode('simple');
    }
  }, [clipCount, mode]);

  // Initialize clips for advanced mode
  useEffect(() => {
    const count = parseInt(clipCount, 10);
    if (mode === 'advanced' && count > 0 && videoDuration > 0) {
      const segmentDuration = Math.min(30, videoDuration / count);
      
      const newClips: ClipSegment[] = Array.from({ length: count }, (_, i) => {
        const startTime = Math.min((videoDuration / count) * i, videoDuration - segmentDuration);
        const endTime = Math.min(startTime + segmentDuration, videoDuration);
        
        return {
          id: `clip-${i + 1}`,
          label: `Clip ${i + 1}`,
          startTime,
          endTime,
          duration: endTime - startTime,
          title: globalTitle ? `${globalTitle} - Part ${i + 1}` : "",
          description: globalDescription,
          hashtags: globalHashtags,
        };
      });
      
      setClips(newClips);
    }
  }, [clipCount, videoDuration, globalTitle, globalDescription, globalHashtags, mode]);

  // Update video duration when metadata loads
  useEffect(() => {
    if (initialVideoDuration > 0) {
      setVideoDuration(initialVideoDuration);
      setEndTime(Math.min(initialVideoDuration, 60));
      setVideoPlayerKey(Date.now());
    }
  }, [initialVideoDuration]);

  const handleLoadedMetadata = (duration: number) => {
    console.log("Video metadata loaded with duration:", duration);
    if (duration > 0 && duration !== videoDuration) {
      setVideoDuration(duration);
      const newDefaultEndTime = Math.min(duration, 60);
      setEndTime(newDefaultEndTime);
      setStartTime(0);
    }
  };

  // Check for overlaps in advanced mode
  const checkForOverlaps = (clips: ClipSegment[]): ClipSegment[] => {
    if (allowOverlap) return clips;
    
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
    const overlaps: string[] = [];
    
    for (let i = 0; i < sortedClips.length - 1; i++) {
      const current = sortedClips[i];
      const next = sortedClips[i + 1];
      
      if (current.endTime > next.startTime) {
        overlaps.push(current.id, next.id);
      }
    }
    
    return clips.map(clip => ({
      ...clip,
      hasOverlap: overlaps.includes(clip.id)
    }));
  };

  const updateClip = (clipId: string, updates: Partial<ClipSegment>) => {
    setClips(prev => {
      const updated = prev.map(clip => 
        clip.id === clipId 
          ? { 
              ...clip, 
              ...updates, 
              duration: updates.endTime && updates.startTime 
                ? updates.endTime - updates.startTime 
                : updates.endTime 
                  ? updates.endTime - clip.startTime
                  : updates.startTime 
                    ? clip.endTime - updates.startTime
                    : clip.duration
            }
          : clip
      );
      return checkForOverlaps(updated);
    });
  };

  const handleSliderChange = (value: number[]) => {
    if (value.length === 2) {
      setStartTime(value[0]);
      setEndTime(value[1]);
    }
  };

  const handleAdvancedSliderChange = (clipId: string, values: number[]) => {
    if (values.length === 2) {
      const [start, end] = values;
      updateClip(clipId, { startTime: start, endTime: end });
    }
  };

  const handleTimeInputChange = (clipId: string, field: 'startTime' | 'endTime', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= videoDuration) {
      updateClip(clipId, { [field]: numValue });
    }
  };

  const seekToClipStart = (clip: ClipSegment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      setCurrentTime(clip.startTime);
    }
  };

  const playClipPreview = (clip: ClipSegment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      videoRef.current.play();
      setIsPlaying(true);
      
      const checkTime = () => {
        if (videoRef.current && videoRef.current.currentTime >= clip.endTime) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else if (isPlaying) {
          requestAnimationFrame(checkTime);
        }
      };
      checkTime();
    }
  };

  const evenlyDistribute = () => {
    const count = clips.length;
    if (count === 0 || videoDuration === 0) return;
    
    const segmentDuration = Math.min(30, videoDuration / count);
    const spacing = (videoDuration - segmentDuration) / Math.max(1, count - 1);
    
    const distributedClips = clips.map((clip, i) => {
      const startTime = i * spacing;
      const endTime = Math.min(startTime + segmentDuration, videoDuration);
      
      return {
        ...clip,
        startTime,
        endTime,
        duration: endTime - startTime,
      };
    });
    
    setClips(checkForOverlaps(distributedClips));
  };

  const generateAIClipCopy = async () => {
    setIsGeneratingAI(true);
    try {
      const numClips = parseInt(clipCount, 10);
      const response = await fetch('/api/ai/clip-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: mode === 'simple' ? title : globalTitle || "Video clip",
          description: mode === 'simple' ? description : globalDescription || "A video clip",
          videoContext: videoUrl || description || title || "A video clip",
          targetAudience: "general",
          platform: platform || "tiktok",
          clipCount: numClips,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result?.data) {
        if (mode === 'simple') {
          setTitle(result.data.titles?.[0] || "");
          setDescription(result.data.descriptions?.[0] || "");
          setHashtags(result.data.hashtags?.join(" ") || "");
        } else {
          setGlobalTitle(result.data.titles?.[0] || "");
          setGlobalDescription(result.data.descriptions?.[0] || "");
          setGlobalHashtags(result.data.hashtags?.join(" ") || "");
          
          // Update individual clips with variations
          if (result.data.titles && result.data.titles.length > 1) {
            setClips(prev => prev.map((clip, i) => ({
              ...clip,
              title: result.data.titles[i] || result.data.titles[0] || "",
              description: result.data.descriptions?.[i] || result.data.descriptions?.[0] || "",
              hashtags: result.data.hashtags?.join(" ") || "",
            })));
          }
        }

        toast({
          title: "AI Content Generated",
          description: `Generated content for ${numClips} clip${numClips > 1 ? 's' : ''}`,
        });
      }
    } catch (error) {
      console.error("Failed to generate AI copy:", error);
      toast({
        title: "AI Generation Failed",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCreateClips = async () => {
    setIsCreatingClips(true);
    const numClips = parseInt(clipCount, 10);
    const selectedPlatform = platformOptions.find(p => p.value === platform);
    const aspectRatio = selectedPlatform?.aspectRatio || "9:16";

    try {
      const createdClips = [];
      
      if (mode === 'simple') {
        // Simple mode: create clips with same time range
        for (let i = 0; i < numClips; i++) {
          const clipTitle = numClips > 1 ? `${title || 'Generated Clip'} - Part ${i + 1}` : title || 'Generated Clip';
          
          const response = await fetch('/api/clips', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalVideoId: videoId,
              title: clipTitle,
              description,
              hashtags,
              startTime,
              endTime,
              platform,
              aspectRatio,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create clip ${i + 1}: HTTP ${response.status}`);
          }

          const result = await response.json();
          createdClips.push(result.data);
        }
      } else {
        // Advanced mode: create clips with individual time ranges
        for (const clip of clips) {
          const response = await fetch('/api/clips', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalVideoId: videoId,
              title: clip.title || globalTitle || clip.label,
              description: clip.description || globalDescription,
              hashtags: clip.hashtags || globalHashtags,
              startTime: clip.startTime,
              endTime: clip.endTime,
              platform,
              aspectRatio,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create ${clip.label}: HTTP ${response.status}`);
          }

          const result = await response.json();
          createdClips.push(result.data);
        }
      }

      toast({
        title: "Clips Created Successfully",
        description: `Created ${createdClips.length} clips successfully`,
      });

      onClipsCreated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create clips:', error);
      toast({
        title: "Clip Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClips(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[90vh] overflow-y-auto",
        mode === 'simple' ? "sm:max-w-[800px]" : "sm:max-w-[95vw] lg:max-w-[1200px]"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Clips
            <Badge variant={mode === 'simple' ? 'default' : 'secondary'}>
              {mode === 'simple' ? 'Simple Mode' : 'Multi-Timeline Mode'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {mode === 'simple' 
              ? "Create clips with the same time range. Switch to multi-timeline mode for individual clip timings."
              : "Set up multiple clips with their own start and end points. Each clip has its own timeline controls."
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as 'simple' | 'advanced')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Simple Mode
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Multi-Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video Preview */}
              <div className="space-y-4">
                {videoUrl && (
                  <div className="w-full">
                    <VideoJSPlayer 
                      key={videoPlayerKey}
                      src={videoUrl} 
                      onLoadedMetadata={handleLoadedMetadata} 
                    />
                    <div className="mt-4 px-1">
                      <Label>Trim Video (Start: {startTime.toFixed(1)}s, End: {endTime.toFixed(1)}s)</Label>
                      <Slider
                        min={0}
                        max={videoDuration}
                        step={0.1}
                        value={[startTime, endTime]}
                        onValueChange={handleSliderChange}
                        className="mt-2"
                        disabled={!videoDuration || videoDuration === 0}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Clip Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., My Awesome Clip"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="description">Clip Description</Label>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={generateAIClipCopy} 
                      disabled={isGeneratingAI || !videoUrl}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      AI Generate
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your clip. AI can help generate or improve this."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Input
                    id="hashtags"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="E.g., #awesome, #clip, #fun"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clipCount">Number of Clips</Label>
                    <Select value={clipCount} onValueChange={setClipCount}>
                      <SelectTrigger id="clipCount">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {(i + 1).toString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger id="platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platformOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Preview & Global Settings */}
              <div className="lg:col-span-1 space-y-4">
                {videoUrl && (
                  <div className="w-full">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-48 object-contain bg-black rounded-lg"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => handleLoadedMetadata(e.currentTarget.duration)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      controls
                      preload="metadata"
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Current: {formatTime(currentTime)} / {formatTime(videoDuration)}
                    </div>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Global Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="globalTitle">Base Title</Label>
                      <Input
                        id="globalTitle"
                        value={globalTitle}
                        onChange={(e) => setGlobalTitle(e.target.value)}
                        placeholder="Base title for all clips"
                      />
                    </div>

                    <div>
                      <Label htmlFor="globalDescription">Base Description</Label>
                      <Textarea
                        id="globalDescription"
                        value={globalDescription}
                        onChange={(e) => setGlobalDescription(e.target.value)}
                        placeholder="Base description for all clips"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="globalHashtags">Base Hashtags</Label>
                      <Input
                        id="globalHashtags"
                        value={globalHashtags}
                        onChange={(e) => setGlobalHashtags(e.target.value)}
                        placeholder="#example #hashtags"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="clipCount">Clips</Label>
                        <Select value={clipCount} onValueChange={setClipCount}>
                          <SelectTrigger id="clipCount">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(10)].map((_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {(i + 1).toString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="platform">Platform</Label>
                        <Select value={platform} onValueChange={setPlatform}>
                          <SelectTrigger id="platform">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {platformOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAIClipCopy}
                        disabled={isGeneratingAI}
                        className="flex-1"
                      >
                        {isGeneratingAI ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        AI Generate
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={evenlyDistribute}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Auto-Distribute
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allowOverlap"
                        checked={allowOverlap}
                        onChange={(e) => setAllowOverlap(e.target.checked)}
                      />
                      <Label htmlFor="allowOverlap" className="text-sm">
                        Allow overlapping clips
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Individual Clip Timelines */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Individual Clip Timelines</h3>
                  <Badge variant="secondary">
                    {clips.length} clip{clips.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {clips.map((clip) => {
                    const hasOverlap = clip.hasOverlap;

                    return (
                      <Card key={clip.id} className={cn(
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
                                onClick={() => seekToClipStart(clip)}
                                className="h-6 w-6 p-0"
                              >
                                ⏭
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => playClipPreview(clip)}
                                className="h-6 w-6 p-0"
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

                        <CardContent className="pt-0 space-y-3">
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
                              onValueChange={(values) => handleAdvancedSliderChange(clip.id, values)}
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
                                onChange={(e) => handleTimeInputChange(clip.id, 'startTime', e.target.value)}
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
                                onChange={(e) => handleTimeInputChange(clip.id, 'endTime', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>

                          {/* Clip-specific metadata */}
                          <div className="grid grid-cols-1 gap-2">
                            <Input
                              placeholder={`Title for ${clip.label}`}
                              value={clip.title || ''}
                              onChange={(e) => updateClip(clip.id, { title: e.target.value })}
                              className="h-8 text-xs"
                            />
                            <Input
                              placeholder={`Description for ${clip.label}`}
                              value={clip.description || ''}
                              onChange={(e) => updateClip(clip.id, { description: e.target.value })}
                              className="h-8 text-xs"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {mode === 'advanced' && (
                <>Total duration: {formatTime(clips.reduce((sum, clip) => sum + clip.duration, 0))}</>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreatingClips}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateClips} 
                disabled={
                  isCreatingClips || 
                  videoDuration === 0 || 
                  (mode === 'simple' && (endTime - startTime < 1)) ||
                  (mode === 'advanced' && clips.length === 0)
                }
              >
                {isCreatingClips ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isCreatingClips 
                  ? "Creating..." 
                  : `Create ${mode === 'simple' ? clipCount : clips.length} Clip${parseInt(clipCount, 10) > 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
