import { useState, useCallback, useEffect } from 'react'

interface UseCaptionsOptions {
  format?: 'srt' | 'vtt'
  language?: string
  onSuccess?: (captions: string) => void
  onError?: (error: Error) => void
}

interface CaptionJobStatus {
  id: string
  state: string
  progress: number
  result?: {
    captionUrl: string
    format: string
  }
  failedReason?: string
}

export function useCaptions(videoId: string, options: UseCaptionsOptions = {}) {
  const [captions, setCaptions] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [jobStatus, setJobStatus] = useState<CaptionJobStatus | null>(null)

  const generateCaptions = useCallback(async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/captions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videos: [videoId],
          format: options.format,
          language: options.language
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate captions')
      }

      const { jobs } = await response.json()
      setJobStatus({ id: jobs[0].id, state: 'waiting', progress: 0 })

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to generate captions')
      setError(err)
      options.onError?.(err)
    }
  }, [videoId, options])

  const saveCaptions = useCallback(async (captionText: string) => {
    try {
      setError(null)

      const response = await fetch('/api/captions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          captions: captionText,
          format: options.format
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save captions')
      }

      setCaptions(captionText)
      options.onSuccess?.(captionText)

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to save captions')
      setError(err)
      options.onError?.(err)
    }
  }, [videoId, options])

  // Poll for job status when a job is in progress
  useEffect(() => {
    if (!jobStatus?.id || ['completed', 'failed'].includes(jobStatus.state)) {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/captions/batch?jobId=${jobStatus.id}`)
        if (!response.ok) {
          throw new Error('Failed to get job status')
        }

        const status = await response.json()
        setJobStatus(status)

        if (status.state === 'completed') {
          // Fetch the caption content
          const captionResponse = await fetch(status.result.captionUrl)
          if (!captionResponse.ok) {
            throw new Error('Failed to fetch captions')
          }

          const captionText = await captionResponse.text()
          setCaptions(captionText)
          options.onSuccess?.(captionText)
          setIsGenerating(false)
        } else if (status.state === 'failed') {
          throw new Error(status.failedReason || 'Caption generation failed')
        }

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to check job status')
        setError(err)
        options.onError?.(err)
        setIsGenerating(false)
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [jobStatus?.id, jobStatus?.state, options])

  return {
    captions,
    isGenerating,
    error,
    jobStatus,
    generateCaptions,
    saveCaptions
  }
}
