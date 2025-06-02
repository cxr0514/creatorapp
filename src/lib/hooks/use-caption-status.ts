import { useState, useEffect, useCallback, useMemo } from 'react'

interface CaptionJobStatus {
  jobId: string
  status: string
  progress: number
}

interface CaptionStatusHookResult {
  jobStatuses: Record<string, CaptionJobStatus>
  error: string | null
  isLoading: boolean
  updateStatus: () => Promise<void>
}

export default function useCaptionStatus(jobIds: string[]): CaptionStatusHookResult {
  const [jobStatuses, setJobStatuses] = useState<Record<string, CaptionJobStatus>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Memoize the joined jobIds to avoid complex expressions in dependency arrays
  const jobIdsString = useMemo(() => jobIds.join(','), [jobIds])

  const updateStatus = useCallback(async () => {
    if (!jobIds.length) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/captions/batch?jobIds=${jobIds.join(',')}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job status')
      }

      const data = await response.json()
      const newStatuses: Record<string, CaptionJobStatus> = {}
      data.statuses.forEach((status: CaptionJobStatus) => {
        newStatuses[status.jobId] = status
      })
      setJobStatuses(newStatuses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [jobIds])

  useEffect(() => {
    let isMounted = true
    let intervalId: NodeJS.Timeout

    const pollStatus = async () => {
      if (!isMounted) return
      await updateStatus()
      
      // Continue polling if any job is still in progress
      const hasInProgressJobs = Object.values(jobStatuses).some(
        status => ['queued', 'active', 'waiting'].includes(status.status)
      )
      
      if (hasInProgressJobs && isMounted) {
        intervalId = setTimeout(pollStatus, 3000) // Poll every 3 seconds
      }
    }

    if (jobIds.length) {
      pollStatus()
    }

    return () => {
      isMounted = false
      if (intervalId) {
        clearTimeout(intervalId)
      }
    }
  }, [jobIdsString, jobIds.length, updateStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  return { jobStatuses, error, isLoading, updateStatus }
}
