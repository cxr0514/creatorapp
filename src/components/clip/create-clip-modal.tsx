import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import VideoJSPlayer from '@/components/dashboard/video-js-player';
import { Loader2, Sparkles } from 'lucide-react';
import { api } from '@/trpc/react';

interface CreateClipModalProps {
  videoId: string;
  videoUrl: string;
  videoDuration: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const platformOptions = [
  { label: 'TikTok / Reels / Shorts', value: 'tiktok', ratio: '9:16' },
  { label: 'Instagram Feed', value: 'instagram_feed', ratio: '1:1' },
  { label: 'X / Twitter', value: 'twitter', ratio: '16:9' },
];

export function CreateClipModal({ videoId, videoUrl, videoDuration, isOpen, onOpenChange }: CreateClipModalProps) {
  const [titles, setTitles] = useState<string[]>(['']);
  const [descriptions, setDescriptions] = useState<string[]>(['']);
  const [hashtagsList, setHashtagsList] = useState<string[]>(['']);
  const [clipCount, setClipCount] = useState<number>(1);
  const [platform, setPlatform] = useState(platformOptions[0].value);
  const [ratio, setRatio] = useState(platformOptions[0].ratio);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(Math.min(videoDuration, 60));
  const [loadingAI, setLoadingAI] = useState(false);
  const [creating, setCreating] = useState(false);

  const { refetch } = api.clip.getAll.useQuery({ videoId });

  // reset arrays when clipCount changes
  useEffect(() => {
    setTitles(Array(clipCount).fill(''));
    setDescriptions(Array(clipCount).fill(''));
    setHashtagsList(Array(clipCount).fill(''));
  }, [clipCount]);

  const handleGenerateAI = async () => {
    setLoadingAI(true);
    try {
      // call existing REST AI endpoint
      const resp = await fetch('/api/ai/clip-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      const json = await resp.json();
      const { title, description, hashtags } = json;
      setTitles(Array(clipCount).fill(title));
      setDescriptions(Array(clipCount).fill(description));
      setHashtagsList(Array(clipCount).fill(hashtags));
    } catch (err) {
      console.error('AI generation failed', err);
      alert('Failed to generate AI copy');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCreateClips = async () => {
    setCreating(true);
    for (let i = 0; i < clipCount; i++) {
      await fetch('/api/clips/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalVideoId: videoId,
          title: titles[i] || `Clip ${i+1}`,
          description: descriptions[i],
          hashtags: hashtagsList[i],
          startTime: start,
          endTime: end,
          platform,
          aspectRatio: ratio,
        }),
      });
    }
    await refetch();
    setCreating(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Clips</DialogTitle>
          <DialogDescription>Select options, preview, and generate clips.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Video Preview & Trim */}
          <div>
            {videoUrl && (
              <>
                <VideoJSPlayer src={videoUrl} onLoadedMetadata={d => setEnd(Math.min(d, 60))} />
                <div className="mt-2">
                  <Label>Trim (s): {start.toFixed(1)} - {end.toFixed(1)}</Label>
                  <Slider
                    min={0}
                    max={videoDuration}
                    step={0.1}
                    value={[start, end]}
                    onValueChange={([s, e]) => { setStart(s); setEnd(e); }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div>
              <Label>Number of Clips</Label>
              <Select value={clipCount.toString()} onValueChange={v => setClipCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i} value={(i+1).toString()}>{i+1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={v => {
                setPlatform(v);
                const opt = platformOptions.find(o => o.value === v);
                if (opt) setRatio(opt.ratio);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Aspect Ratio</Label>
              <Select value={ratio} onValueChange={setRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['9:16','1:1','16:9'].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI Copy & Fields */}
        <div className="space-y-4">
          {titles.map((_, idx) => (
            <div key={idx} className="border p-4 rounded">
              <Label>Title {idx+1}</Label>
              <Input value={titles[idx]} onChange={e => {
                const arr = [...titles]; arr[idx] = e.target.value; setTitles(arr);
              }} />

              <Label className="mt-2">Description {idx+1}</Label>
              <div className="flex items-start">
                <Textarea
                  className="flex-1"
                  rows={3} value={descriptions[idx]}
                  onChange={e => {
                    const arr = [...descriptions]; arr[idx] = e.target.value; setDescriptions(arr);
                  }}
                />
                <Button
                  className="ml-2"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={loadingAI}
                >
                  {loadingAI ? <Loader2 className="animate-spin" /> : <Sparkles />}
                </Button>
              </div>

              <Label className="mt-2">Hashtags {idx+1}</Label>
              <Input
                value={hashtagsList[idx]}
                placeholder="#tag1, #tag2"
                onChange={e => {
                  const arr = [...hashtagsList]; arr[idx] = e.target.value; setHashtagsList(arr);
                }}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>Cancel</Button>
          <Button onClick={handleCreateClips} disabled={creating || start >= end}>
            {creating ? <Loader2 className="mr-2 animate-spin" /> : 'Create Clips'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
