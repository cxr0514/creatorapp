// filepath: /Users/CXR0514/Library/CloudStorage/OneDrive-TheHomeDepot/Documents 1/creators/creatorapp/src/components/dashboard/create-clip-modal.tsx
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
import { useEffect, useState } from "react";
import VideoJSPlayer from "./video-js-player"; 
import "video.js/dist/video-js.css";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CreateClipModalProps {
  videoId: string;
  videoUrl: string;
  videoDuration: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClipsCreated?: () => void; // Added callback for when clips are successfully created
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [clipCount, setClipCount] = useState<string>("1");
  const [platform, setPlatform] = useState<string>(platformOptions[0].value);
  
  const [internalVideoDuration, setInternalVideoDuration] = useState(initialVideoDuration || 0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(initialVideoDuration || 60, 60));

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isCreatingClips, setIsCreatingClips] = useState(false);
  const [videoPlayerKey, setVideoPlayerKey] = useState(Date.now());

  const { toast } = useToast();

  useEffect(() => {
    // Update internal duration and endTime when initialVideoDuration changes and is valid
    if (initialVideoDuration > 0) {
      setInternalVideoDuration(initialVideoDuration);
      setEndTime(Math.min(initialVideoDuration, 60)); 
      setStartTime(0); // Reset start time as well
      setVideoPlayerKey(Date.now()); // Force VideoJSPlayer to re-initialize with new duration
    }
  }, [initialVideoDuration]);

  const handleLoadedMetadata = (duration: number) => {
    console.log("handleLoadedMetadata in modal called with duration:", duration); 
    if (duration > 0 && duration !== internalVideoDuration) {
      setInternalVideoDuration(duration);
      // Set default end time to min of duration or 60s
      const newDefaultEndTime = Math.min(duration, 60);
      setEndTime(newDefaultEndTime);
      setStartTime(0); // Reset startTime when new video metadata is loaded
      console.log(`Video metadata loaded. Duration: ${duration}, Start: 0, End: ${newDefaultEndTime}`);
    } else if (duration <= 0) {
      console.warn("Loaded metadata reported duration of 0 or less. Check video source.");
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (value.length === 2) {
      setStartTime(value[0]);
      setEndTime(value[1]);
    }
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
          videoContext: videoUrl || "A video clip",
          targetAudience: "General audience", 
          platform: platform,
          tone: "casual",
          clipCount: numClips
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result?.data) {
        // Populate form with AI-generated content based on clip count
        setTitle(result.data.titles?.[0] || "");
        setDescription(result.data.descriptions?.[0] || "");
        setHashtags(result.data.hashtags?.join(" ") || "");
        
        if (result.data.ideas && result.data.ideas.length > 0) {
          console.log("AI Generated Ideas:", result.data.ideas);
        }

        toast({
          title: "AI Content Generated",
          description: `Generated ${numClips} set${numClips > 1 ? 's' : ''} of titles, descriptions, and hashtags`,
        });
      }
    } catch (error) {
      console.error("Failed to generate AI copy:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while generating AI copy.';
      
      toast({
        title: "AI Generation Failed",
        description: errorMessage,
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

      toast({
        title: "Clips Created Successfully",
        description: `Created ${numClips} clip${numClips > 1 ? 's' : ''} successfully`,
      });

      // Call the callback to refresh the clips list
      onClipsCreated?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Failed to create clips:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while creating clips.';
      
      toast({
        title: "Clip Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingClips(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Create New Clips</DialogTitle>
          <DialogDescription>
            Select a portion of your video, add details, and generate short clips.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            {videoUrl && (
              <div className="w-full">
                <VideoJSPlayer 
                  key={videoPlayerKey} // Added key to force re-render
                  src={videoUrl} 
                  onLoadedMetadata={handleLoadedMetadata} 
                  // onTimeUpdate can be added if needed for other features
                />
                <div className="mt-4 px-1">
                  <Label>Trim Video (Start: {startTime.toFixed(1)}s, End: {endTime.toFixed(1)}s)</Label>
                  <Slider
                    min={0}
                    max={internalVideoDuration} // Use internalVideoDuration for slider max
                    step={0.1}
                    value={[startTime, endTime]}
                    onValueChange={handleSliderChange}
                    className="mt-2"
                    // Disable slider if duration is 0 or not yet loaded
                    disabled={!internalVideoDuration || internalVideoDuration === 0}
                  />
                </div>
              </div>
            )}
          </div>
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
                  AI Generate / Improve
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
              <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
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
                    <SelectValue placeholder="Select number of clips" />
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
                    <SelectValue placeholder="Select platform" />
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreatingClips}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateClips} 
            disabled={isCreatingClips || !videoUrl || internalVideoDuration === 0 || (endTime - startTime < 1)}
          >
            {isCreatingClips ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isCreatingClips ? "Creating..." : `Create ${clipCount} Clip${parseInt(clipCount, 10) > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
