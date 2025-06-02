'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Upload } from 'lucide-react'

interface Caption {
  id: number
  start: number
  end: number
  text: string
}

interface CaptionProgress {
  jobId: string
  status: string
  progress: number
}

interface CaptionEditorProps {
  videoId: string
  initialCaptions?: string
  format?: 'srt' | 'vtt'
  onSave?: (captions: string) => Promise<void>
  isGenerating?: boolean
  onGenerate?: () => Promise<void>
  progress?: CaptionProgress
}

function parseTimestamp(timestamp: string): number {
  const [time, ms] = timestamp.split(',')
  const [hours, minutes, seconds] = time.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

function parseSRT(srt: string): Caption[] {
  const blocks = srt.trim().split('\n\n')
  return blocks.map(block => {
    const [id, timing, ...textLines] = block.split('\n')
    const [start, end] = timing.split(' --> ').map(parseTimestamp)
    return {
      id: parseInt(id),
      start,
      end,
      text: textLines.join('\n')
    }
  })
}

function parseVTT(vtt: string): Caption[] {
  const blocks = vtt.trim().split('\n\n').slice(1) // Skip WEBVTT header
  return blocks.map((block, index) => {
    const [timing, ...textLines] = block.split('\n')
    const [start, end] = timing.split(' --> ').map(t => parseTimestamp(t.replace('.', ',')))
    return {
      id: index + 1,
      start,
      end,
      text: textLines.join('\n')
    }
  })
}

function formatSRT(captions: Caption[]): string {
  return captions.map(caption => (
    `${caption.id}\n${formatTimestamp(caption.start)} --> ${formatTimestamp(caption.end)}\n${caption.text}\n`
  )).join('\n')
}

function formatVTT(captions: Caption[]): string {
  return `WEBVTT\n\n${captions.map(caption => (
    `${formatTimestamp(caption.start).replace(',', '.')} --> ${formatTimestamp(caption.end).replace(',', '.')}\n${caption.text}\n`
  )).join('\n')}`
}

export function CaptionEditor({
  initialCaptions = '',
  format = 'srt',
  onSave,
  isGenerating = false,
  onGenerate,
  progress
}: CaptionEditorProps) {
  const [activeFormat, setActiveFormat] = useState<'srt' | 'vtt'>(format)
  const [rawText, setRawText] = useState(initialCaptions)
  const [captions, setCaptions] = useState<Caption[]>([])
  const [editingCaption, setEditingCaption] = useState<Caption | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialCaptions) {
      const parsed = format === 'srt' ? parseSRT(initialCaptions) : parseVTT(initialCaptions)
      setCaptions(parsed)
      setRawText(initialCaptions)
    }
  }, [initialCaptions, format])

  const handleRawTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setRawText(text)
    try {
      const parsed = activeFormat === 'srt' ? parseSRT(text) : parseVTT(text)
      setCaptions(parsed)
    } catch (error) {
      console.error('Failed to parse captions:', error)
    }
  }

  const handleCaptionEdit = (caption: Caption) => {
    const newCaptions = captions.map(c => c.id === caption.id ? caption : c)
    setCaptions(newCaptions)
    setRawText(activeFormat === 'srt' ? formatSRT(newCaptions) : formatVTT(newCaptions))
  }

  const handleSave = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(rawText)
    } catch (error) {
      console.error('Failed to save captions:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFormatChange = (value: string) => {
    const format = value as 'srt' | 'vtt'
    setActiveFormat(format)
    const formatted = format === 'srt' ? formatSRT(captions) : formatVTT(captions)
    setRawText(formatted)
  }

  const getProgressStatus = () => {
    if (!progress) return ''
    switch (progress.status) {
      case 'completed':
        return '✓ Generation complete'
      case 'failed':
        return '✗ Generation failed'
      default:
        return `${Math.round(progress.progress)}% Complete`
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Video Captions</h3>
        <div className="flex items-center gap-2">
          {onGenerate && (
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {progress ? getProgressStatus() : 'Generating...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Generate Captions
                </>
              )}
            </Button>
          )}
          {progress && (
            <div className="w-64">
              <Progress 
                value={progress.progress} 
                className="h-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Status: {progress.status}
              </p>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || isGenerating}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue={format}
        value={activeFormat}
        onValueChange={handleFormatChange}
      >
        <TabsList>
          <TabsTrigger value="srt">SRT Format</TabsTrigger>
          <TabsTrigger value="vtt">VTT Format</TabsTrigger>
        </TabsList>

        <TabsContent value="srt" className="space-y-4">
          <Textarea
            value={activeFormat === 'srt' ? rawText : ''}
            onChange={handleRawTextChange}
            placeholder="Paste or edit SRT captions here..."
            className="font-mono h-[400px]"
          />
        </TabsContent>

        <TabsContent value="vtt" className="space-y-4">
          <Textarea
            value={activeFormat === 'vtt' ? rawText : ''}
            onChange={handleRawTextChange}
            placeholder="Paste or edit WebVTT captions here..."
            className="font-mono h-[400px]"
          />
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Visual Editor</h4>
        <div className="space-y-2">
          {captions.map((caption) => (
            <div
              key={caption.id}
              className="p-4 border rounded-lg space-y-2"
              onClick={() => setEditingCaption(caption)}
            >
              {editingCaption?.id === caption.id ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        value={formatTimestamp(caption.start)}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleCaptionEdit({
                          ...caption,
                          start: parseTimestamp(e.target.value)
                        })}
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        value={formatTimestamp(caption.end)}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleCaptionEdit({
                          ...caption,
                          end: parseTimestamp(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Caption Text</Label>
                    <Textarea
                      value={caption.text}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleCaptionEdit({
                        ...caption,
                        text: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingCaption(null)}
                  >
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500">
                    {formatTimestamp(caption.start)} → {formatTimestamp(caption.end)}
                  </div>
                  <div className="text-sm">{caption.text}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
