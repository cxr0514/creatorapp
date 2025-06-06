// Background worker initialization
// This file starts all background workers for the application

import { clipProcessingWorker } from '@/lib/queues/clip-processing-queue'
import { captionWorker } from '@/lib/queues/caption-worker'

// Worker status tracking
const workerStatus = {
  clipProcessing: false,
  captions: false
}

// Initialize all workers
export function initializeWorkers() {
  console.log('[WORKERS] Initializing background workers...')

  try {
    // The clip processing worker is already created, just need to track its status
    console.log('[WORKERS] Clip processing worker started')
    workerStatus.clipProcessing = true

    // The caption worker is already created, just need to track its status  
    console.log('[WORKERS] Caption worker started')
    workerStatus.captions = true

    console.log('[WORKERS] All background workers initialized successfully')
  } catch (error) {
    console.error('[WORKERS] Error initializing workers:', error)
    throw error
  }
}

// Stop all workers gracefully
export async function stopWorkers() {
  console.log('[WORKERS] Stopping background workers...')

  try {
    await clipProcessingWorker.close()
    console.log('[WORKERS] Clip processing worker stopped')
    workerStatus.clipProcessing = false

    await captionWorker.close()
    console.log('[WORKERS] Caption worker stopped')
    workerStatus.captions = false

    console.log('[WORKERS] All background workers stopped')
  } catch (error) {
    console.error('[WORKERS] Error stopping workers:', error)
    throw error
  }
}

// Get worker status
export function getWorkerStatus() {
  return { ...workerStatus }
}

// Auto-initialize workers in non-browser environments
if (typeof window === 'undefined') {
  // Only initialize in server environment
  try {
    initializeWorkers()
    console.log('[WORKERS] Auto-initialized workers in server environment')
  } catch (error) {
    console.error('[WORKERS] Failed to auto-initialize workers:', error)
  }
}

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('[WORKERS] Received SIGTERM, stopping workers...')
    try {
      await stopWorkers()
      process.exit(0)
    } catch (error) {
      console.error('[WORKERS] Error during graceful shutdown:', error)
      process.exit(1)
    }
  })

  process.on('SIGINT', async () => {
    console.log('[WORKERS] Received SIGINT, stopping workers...')
    try {
      await stopWorkers()
      process.exit(0)
    } catch (error) {
      console.error('[WORKERS] Error during graceful shutdown:', error)
      process.exit(1)
    }
  })
}
