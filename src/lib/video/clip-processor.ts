import { spawn, execSync } from 'child_process'
import { createWriteStream, unlinkSync, existsSync, mkdtempSync, readFileSync } from 'fs'
import * as path from 'path'
import * as os from 'os'
import { uploadToB2, getPresignedUrl } from '@/lib/b2'

// Check if FFmpeg is available
function checkFFmpegAvailable(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
    return true
  } catch (error) {
    console.error('[VIDEO-PROCESSOR] FFmpeg not found:', error)
    return false
  }
}

interface ExtractClipOptions {
  startTime: number
  endTime: number
  aspectRatio?: string
  quality?: 'high' | 'medium' | 'low'
}

interface ProcessClipResult {
  clipUrl: string
  thumbnailUrl: string | null
  storageKey: string
  duration: number
}

// Download file from URL to local path
async function downloadFile(url: string, outputPath: string): Promise<void> {
  console.log('[VIDEO-PROCESSOR] Downloading file from:', url, 'to:', outputPath)
  
  try {
    const response = await fetch(url)
    console.log('[VIDEO-PROCESSOR] Download response status:', response.status, 'statusText:', response.statusText)
    console.log('[VIDEO-PROCESSOR] Download response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text available')
      
      // Check if it's a "Key not found" error from B2
      if (response.status === 404 && errorText.includes('NoSuchKey')) {
        throw new Error(`Video file not found in storage. This might be a test video that hasn't been uploaded yet. Status: ${response.status}`)
      }
      
      throw new Error(`Failed to download file: ${response.status} ${response.statusText || 'Unknown error'} - ${errorText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(outputPath)
      writeStream.write(buffer)
      writeStream.end()
      
      writeStream.on('finish', () => {
        console.log('[VIDEO-PROCESSOR] File downloaded successfully to:', outputPath)
        resolve()
      })
      
      writeStream.on('error', (error) => {
        console.error('[VIDEO-PROCESSOR] Error writing file:', error)
        reject(error)
      })
    })
  } catch (error) {
    console.error('[VIDEO-PROCESSOR] Error downloading file:', error)
    throw error
  }
}

// Run FFmpeg command
function runFFmpegCommand(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('[VIDEO-PROCESSOR] Running FFmpeg command:', 'ffmpeg', args.join(' '))
    
    const ffmpeg = spawn('ffmpeg', args, { stdio: 'pipe' })
    
    let stderr = ''
    
    ffmpeg.stderr?.on('data', (data) => {
      stderr += data.toString()
    })
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('[VIDEO-PROCESSOR] FFmpeg command completed successfully')
        resolve()
      } else {
        console.error('[VIDEO-PROCESSOR] FFmpeg command failed with code:', code)
        console.error('[VIDEO-PROCESSOR] FFmpeg stderr:', stderr)
        reject(new Error(`FFmpeg command failed with code ${code}: ${stderr}`))
      }
    })
    
    ffmpeg.on('error', (error) => {
      console.error('[VIDEO-PROCESSOR] FFmpeg spawn error:', error)
      reject(error)
    })
  })
}

export async function extractVideoClip(
  videoUrl: string,
  options: ExtractClipOptions,
  outputStorageKey: string
): Promise<ProcessClipResult> {
  // Check if FFmpeg is available
  if (!checkFFmpegAvailable()) {
    throw new Error('FFmpeg is not available on this system')
  }

  const {
    startTime,
    endTime,
    aspectRatio = '16:9',
    quality = 'medium'
  } = options

  console.log('[VIDEO-PROCESSOR] Starting clip extraction:', {
    videoUrl,
    startTime,
    endTime,
    aspectRatio,
    quality,
    outputStorageKey
  })

  // Create temporary directory
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'video-clip-'))
  const inputPath = path.join(tempDir, 'input.mp4')
  const outputPath = path.join(tempDir, 'output.mp4')
  const thumbnailPath = path.join(tempDir, 'thumbnail.jpg')

  try {
    // Download source video
    await downloadFile(videoUrl, inputPath)

    // Calculate duration
    const duration = endTime - startTime

    // Build FFmpeg command for video clip extraction
    let ffmpegArgs = [
      '-i', inputPath,
      '-ss', startTime.toString(),
      '-t', duration.toString(),
      '-y' // Overwrite output files
    ]

    // Add quality settings
    switch (quality) {
      case 'high':
        ffmpegArgs = ffmpegArgs.concat(['-crf', '18', '-preset', 'slow'])
        break
      case 'medium':
        ffmpegArgs = ffmpegArgs.concat(['-crf', '23', '-preset', 'medium'])
        break
      case 'low':
        ffmpegArgs = ffmpegArgs.concat(['-crf', '28', '-preset', 'fast'])
        break
    }

    // Add aspect ratio handling
    if (aspectRatio === '9:16') {
      // Portrait mode: crop to 9:16
      ffmpegArgs = ffmpegArgs.concat([
        '-vf', 'crop=ih*9/16:ih:(iw-ih*9/16)/2:0'
      ])
    } else if (aspectRatio === '1:1') {
      // Square: crop to 1:1
      ffmpegArgs = ffmpegArgs.concat([
        '-vf', 'crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2'
      ])
    }
    // For 16:9, no cropping needed as most videos are already 16:9

    // Add codec settings
    ffmpegArgs = ffmpegArgs.concat([
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart', // Optimize for web streaming
      outputPath
    ])

    // Extract the video clip
    await runFFmpegCommand(ffmpegArgs)

    // Generate thumbnail at the middle of the clip
    const thumbnailTime = startTime + (duration / 2)
    const thumbnailArgs = [
      '-i', inputPath,
      '-ss', thumbnailTime.toString(),
      '-vframes', '1',
      '-y',
      thumbnailPath
    ]

    await runFFmpegCommand(thumbnailArgs)

    // Upload clip to B2
    console.log('[VIDEO-PROCESSOR] Uploading clip to B2...')
    const clipBuffer = readFileSync(outputPath)
    const clipResult = await uploadToB2(clipBuffer, outputStorageKey, 'video/mp4')
    
    let thumbnailUrl: string | null = null
    
    // Upload thumbnail if it exists
    if (existsSync(thumbnailPath)) {
      console.log('[VIDEO-PROCESSOR] Uploading thumbnail to B2...')
      const thumbnailKey = outputStorageKey.replace('.mp4', '_thumbnail.jpg')
      const thumbnailBuffer = readFileSync(thumbnailPath)
      const thumbnailResult = await uploadToB2(thumbnailBuffer, thumbnailKey, 'image/jpeg')
      thumbnailUrl = thumbnailResult.storageUrl
    }

    console.log('[VIDEO-PROCESSOR] Successfully processed clip:', {
      clipUrl: clipResult.storageUrl,
      thumbnailUrl,
      storageKey: outputStorageKey,
      duration
    })

    return {
      clipUrl: clipResult.storageUrl,
      thumbnailUrl,
      storageKey: outputStorageKey,
      duration
    }

  } catch (error) {
    console.error('[VIDEO-PROCESSOR] Error extracting video clip:', error)
    throw new Error(`Failed to extract video clip: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    // Clean up temporary files
    try {
      if (existsSync(inputPath)) unlinkSync(inputPath)
      if (existsSync(outputPath)) unlinkSync(outputPath)
      if (existsSync(thumbnailPath)) unlinkSync(thumbnailPath)
      // Note: We don't remove tempDir as it might be used by other processes
    } catch (cleanupError) {
      console.warn('[VIDEO-PROCESSOR] Error cleaning up temporary files:', cleanupError)
    }
  }
}

// Process video clip from storage (downloads, processes, and uploads)
export async function processVideoClipFromStorage(
  videoStorageKey: string,
  options: ExtractClipOptions,
  outputStorageKey: string
): Promise<ProcessClipResult> {
  try {
    console.log('[VIDEO-PROCESSOR] Processing clip from storage:', { videoStorageKey, outputStorageKey })
    
    // Get presigned URL for the source video
    const videoUrl = await getPresignedUrl(videoStorageKey)
    console.log('[VIDEO-PROCESSOR] Got presigned URL for video:', videoUrl)
    
    // Extract the clip
    return await extractVideoClip(videoUrl, options, outputStorageKey)
    
  } catch (error) {
    console.error('[VIDEO-PROCESSOR] Error processing clip from storage:', error)
    throw new Error(`Failed to process video clip: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
