// Mock storage for development when B2 credentials aren't available
import fs from 'fs'
import path from 'path'

const MOCK_STORAGE_DIR = path.join(process.cwd(), 'mock-storage')

// Ensure mock storage directory exists
if (!fs.existsSync(MOCK_STORAGE_DIR)) {
  fs.mkdirSync(MOCK_STORAGE_DIR, { recursive: true })
}

export async function uploadVideoToMockStorage(
  file: Buffer,
  userId: string,
  filename: string
): Promise<{ key: string; url: string; size: number }> {
  try {
    const timestamp = Date.now()
    const storageKey = `users/${userId}/videos/${timestamp}_${filename}`
    const filePath = path.join(MOCK_STORAGE_DIR, `${timestamp}_${filename}`)
    
    // Write file to local mock storage
    fs.writeFileSync(filePath, file)
    
    console.log(`Mock upload successful: ${storageKey}`)
    
    return {
      key: storageKey,
      url: `http://localhost:3000/mock-storage/${timestamp}_${filename}`,
      size: file.length
    }
  } catch (error) {
    console.error('Mock storage error:', error)
    throw new Error('Failed to save to mock storage')
  }
}

export async function deleteFromMockStorage(storageKey: string): Promise<{ success: boolean }> {
  try {
    // Extract filename from storage key
    const filename = storageKey.split('/').pop()
    if (!filename) return { success: false }
    
    const filePath = path.join(MOCK_STORAGE_DIR, filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Mock delete successful: ${storageKey}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Mock delete error:', error)
    return { success: false }
  }
}

export function listMockStorageVideos(userId: string): Array<{
  key: string
  url: string
  filename?: string
  size?: number
  uploadedAt?: Date
}> {
  try {
    const files = fs.readdirSync(MOCK_STORAGE_DIR)
    
    return files
      .filter(file => file.includes('.'))
      .map(file => {
        const filePath = path.join(MOCK_STORAGE_DIR, file)
        const stats = fs.statSync(filePath)
        
        return {
          key: `users/${userId}/videos/${file}`,
          url: `http://localhost:3000/mock-storage/${file}`,
          filename: file,
          size: stats.size,
          uploadedAt: stats.ctime
        }
      })
  } catch (error) {
    console.error('Mock list error:', error)
    return []
  }
} 