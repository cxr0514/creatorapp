// Rate limiting utility for AI API calls
interface RateLimitInfo {
  lastRequestTime: number
  requestCount: number
}

const rateLimitStore = new Map<string, RateLimitInfo>()

export class RateLimiter {
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 60000) { // 10 requests per minute by default
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now()
    const rateLimitInfo = rateLimitStore.get(identifier)

    if (!rateLimitInfo) {
      rateLimitStore.set(identifier, {
        lastRequestTime: now,
        requestCount: 1
      })
      return true
    }

    // Reset counter if window has expired
    if (now - rateLimitInfo.lastRequestTime > this.windowMs) {
      rateLimitStore.set(identifier, {
        lastRequestTime: now,
        requestCount: 1
      })
      return true
    }

    // Check if limit exceeded
    if (rateLimitInfo.requestCount >= this.maxRequests) {
      return false
    }

    // Increment counter
    rateLimitInfo.requestCount++
    rateLimitInfo.lastRequestTime = now
    rateLimitStore.set(identifier, rateLimitInfo)
    
    return true
  }

  getRemainingRequests(identifier: string): number {
    const rateLimitInfo = rateLimitStore.get(identifier)
    if (!rateLimitInfo) return this.maxRequests

    const now = Date.now()
    if (now - rateLimitInfo.lastRequestTime > this.windowMs) {
      return this.maxRequests
    }

    return Math.max(0, this.maxRequests - rateLimitInfo.requestCount)
  }

  getTimeUntilReset(identifier: string): number {
    const rateLimitInfo = rateLimitStore.get(identifier)
    if (!rateLimitInfo) return 0

    const now = Date.now()
    const timeElapsed = now - rateLimitInfo.lastRequestTime
    return Math.max(0, this.windowMs - timeElapsed)
  }
}

// Default rate limiter instance
export const aiRateLimiter = new RateLimiter(10, 60000) // 10 requests per minute
