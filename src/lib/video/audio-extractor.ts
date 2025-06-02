import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

// Initialize FFmpeg instance
async function initFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()
  
  if (!ffmpeg.loaded) {
    // Load FFmpeg
    await ffmpeg.load({
      coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm')
    })
  }

  return ffmpeg
}

interface ExtractAudioOptions {
  format?: 'mp3' | 'wav'
  startTime?: number
  duration?: number
}

export async function extractAudioFromVideo(
  videoUrl: string | File,
  options: ExtractAudioOptions = {}
): Promise<File> {
  try {
    const {
      format = 'mp3',
      startTime,
      duration
    } = options

    // Initialize FFmpeg
    const ffmpeg = await initFFmpeg()

    // Create input filename
    const inputName = 'input.' + (
      typeof videoUrl === 'string' 
        ? videoUrl.split('.').pop()?.toLowerCase() || 'mp4'
        : videoUrl.name.split('.').pop()?.toLowerCase() || 'mp4'
    )

    // Create output filename
    const outputName = `output.${format}`

    // Write input file to FFmpeg memory
    if (typeof videoUrl === 'string') {
      const response = await fetch(videoUrl)
      const arrayBuffer = await response.arrayBuffer()
      await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer))
    } else {
      const arrayBuffer = await videoUrl.arrayBuffer()
      await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer))
    }

    // Build FFmpeg command
    let command = ['-i', inputName]
    
    // Add time options if specified
    if (startTime !== undefined) {
      command.push('-ss', startTime.toString())
    }
    if (duration !== undefined) {
      command.push('-t', duration.toString())
    }

    // Add output options
    command = command.concat([
      '-vn',                    // Remove video stream
      '-acodec', 'pcm_s16le',  // Use PCM audio codec
      '-ar', '16000',          // Set sample rate to 16kHz (required by Whisper)
      '-ac', '1',              // Convert to mono
      '-f', format,            // Set output format
      outputName               // Output filename
    ])

    // Run FFmpeg command
    await ffmpeg.exec(command)

    // Read the output file
    const data = await ffmpeg.readFile(outputName)
    const audioBlob = new Blob([data], { type: `audio/${format}` })

    // Create and return File object
    return new File([audioBlob], outputName, { type: `audio/${format}` })

  } catch (error) {
    console.error('Error extracting audio:', error)
    throw new Error('Failed to extract audio from video')
  }
}
