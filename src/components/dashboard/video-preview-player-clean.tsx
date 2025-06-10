'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

// Type definition for Video.js player
interface VideoJSPlayer {
  dispose: () => void;
  on: (event: string, handler: () => void) => void;
  currentTime: (time?: number) => number | undefined;
  duration: () => number | undefined;
  play: () => Promise<void> | undefined;
  pause: () => void;
  isDisposed: () => boolean;
}

interface VideoPreviewPlayerProps {
  src: string
  clipStart: number
  clipEnd: number
  className?: string
  onTimeUpdate?: (currentTime: number) => void
  onLoadedMetadata?: (duration: number) => void
}

export default function VideoPreviewPlayer({
  src,
  clipStart,
  clipEnd,
  className = '',
  onTimeUpdate,
  onLoadedMetadata,
}: VideoPreviewPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<VideoJSPlayer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Generate unique key for this player instance to ensure isolation
  const playerKeyRef = useRef(Math.random().toString(36).substr(2, 9))

  const seekToClipStart = useCallback(() => {
    const player = playerRef.current
    if (player) {
      player.currentTime(clipStart)
    }
  }, [clipStart])

  const playFromClipStart = useCallback(() => {
    const player = playerRef.current
    if (player) {
      const currentTime = player.currentTime()
      
      // Seek to clip start if we're outside bounds
      if (currentTime !== undefined && (currentTime < clipStart || currentTime >= clipEnd)) {
        player.currentTime(clipStart)
      }
      
      player.play()
    }
  }, [clipStart, clipEnd])

  const pausePlayer = useCallback(() => {
    const player = playerRef.current
    if (player) {
      player.pause()
    }
  }, [])

  useEffect(() => {
    // Make sure Video.js player is only initialized once per instance
    if (!playerRef.current && videoRef.current) {
      // The Video.js player needs to be inside the component el
      const videoElement = document.createElement('video-js')
      
      videoElement.classList.add('vjs-big-play-centered')
      videoElement.setAttribute('data-player-id', playerKeyRef.current)
      videoRef.current.appendChild(videoElement)

      const player = playerRef.current = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{
          src: src,
          type: 'video/mp4'
        }],
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        plugins: {},
      }, () => {
        console.log(`Video.js player ${playerKeyRef.current} is ready`)
        
        // Set initial time to clip start
        if (player && clipStart > 0) {
          player.currentTime(clipStart)
        }
      }) as VideoJSPlayer

      // Listen to player events
      player.on('timeupdate', () => {
        const currentTime = player.currentTime()
        if (currentTime !== undefined) {
          onTimeUpdate?.(currentTime)
          
          // Auto-pause when reaching clip end
          if (currentTime >= clipEnd && isPlaying) {
            player.pause()
            setIsPlaying(false)
          }
        }
      })

      player.on('loadedmetadata', () => {
        const duration = player.duration()
        if (duration !== undefined) {
          onLoadedMetadata?.(duration)
        }
        
        // Set initial time to clip start after metadata loads
        if (clipStart > 0) {
          player.currentTime(clipStart)
        }
      })

      player.on('play', () => {
        setIsPlaying(true)
        
        // If we're not in the clip range, seek to clip start
        const currentTime = player.currentTime()
        if (currentTime !== undefined && (currentTime < clipStart || currentTime >= clipEnd)) {
          player.currentTime(clipStart)
        }
      })

      player.on('pause', () => {
        setIsPlaying(false)
      })
      
      player.on('seeked', () => {
        // Ensure we stay within clip bounds
        const currentTime = player.currentTime()
        if (currentTime !== undefined) {
          if (currentTime < clipStart) {
            player.currentTime(clipStart)
          } else if (currentTime >= clipEnd) {
            player.currentTime(clipEnd - 0.1) // Slight buffer before end
          }
        }
      })
    }
  }, [src, clipStart, clipEnd, onTimeUpdate, onLoadedMetadata, isPlaying])

  // Update player when clip bounds change
  useEffect(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.currentTime()
      
      // If current time is outside new bounds, seek to start
      if (currentTime !== undefined && (currentTime < clipStart || currentTime >= clipEnd)) {
        playerRef.current.currentTime(clipStart)
      }
    }
  }, [clipStart, clipEnd])

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current
    const playerKey = playerKeyRef.current

    return () => {
      if (player && !player.isDisposed()) {
        console.log(`Disposing Video.js player ${playerKey}`)
        player.dispose()
        playerRef.current = null
      }
    }
  }, [])

  // Expose methods for parent components
  useEffect(() => {
    if (playerRef.current) {
      // Add clip methods to player instance for external access
      (playerRef.current as VideoJSPlayer & { clipMethods?: any }).clipMethods = {
        playClip: playFromClipStart,
        pauseClip: pausePlayer,
        seekToStart: seekToClipStart,
        isPlaying: () => isPlaying
      }
    }
  }, [isPlaying, playFromClipStart, pausePlayer, seekToClipStart])

  return (
    <div className={`video-preview-player ${className}`}>
      <div ref={videoRef} className="w-full" />
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Clip: {clipStart.toFixed(1)}s - {clipEnd.toFixed(1)}s
      </div>
    </div>
  )
}
