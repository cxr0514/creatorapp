'use client'

import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

declare global {
  interface Window {
    videoPlayer?: {
      duration: () => number
      play: () => void
      pause: () => void
      muted: (value?: boolean) => boolean
      currentTime: (time?: number) => number
    }
  }
}

interface VideoJSPlayerProps {
  src: string
  onTimeUpdate?: (currentTime: number) => void
  onLoadedMetadata?: (duration: number) => void
  onPlay?: () => void
  onPause?: () => void
  className?: string
}

export default function VideoJSPlayer({
  src,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  className = ''
}: VideoJSPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  // Using any type here due to video.js complex type definitions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null)

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be inside the component el
      const videoElement = document.createElement('video-js')
      
      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current?.appendChild(videoElement)

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
        console.log('Video.js player is ready')
      })

      // Listen to player events
      player.on('timeupdate', () => {
        const currentTime = player.currentTime()
        if (currentTime !== undefined) {
          onTimeUpdate?.(currentTime)
        }
      })

      player.on('loadedmetadata', () => {
        const duration = player.duration()
        if (duration !== undefined) {
          onLoadedMetadata?.(duration)
        }
      })

      player.on('play', () => {
        onPlay?.()
      })

      player.on('pause', () => {
        onPause?.()
      })
    }
  }, [src, onTimeUpdate, onLoadedMetadata, onPlay, onPause])

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  // Expose player methods
  useEffect(() => {
    if (playerRef.current) {
      // Add custom methods to window for external control
      window.videoPlayer = {
        duration: () => playerRef.current?.duration() || 0,
        play: () => playerRef.current?.play(),
        pause: () => playerRef.current?.pause(),
        muted: (value?: boolean) => {
          if (value !== undefined) {
            return playerRef.current?.muted(value) || false
          }
          return playerRef.current?.muted() || false
        },
        currentTime: (time?: number) => {
          if (time !== undefined) {
            playerRef.current?.currentTime(time)
            return time
          }
          return playerRef.current?.currentTime() || 0
        }
      }
    }
  }, [])

  return (
    <div className={`video-js-wrapper ${className}`}>
      <div ref={videoRef} className="w-full" />
    </div>
  )
}
