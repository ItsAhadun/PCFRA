/**
 * In-memory rate limiter using sliding window algorithm.
 * Note: This resets on server restart and doesn't work across serverless instances.
 * For production at scale, consider using Redis-based rate limiting (e.g., Upstash).
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
let cleanupTimer: NodeJS.Timeout | null = null

if (typeof global !== 'undefined' && !cleanupTimer) {
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean
  /** Number of requests remaining in current window */
  remaining: number
  /** Time in seconds until the rate limit resets */
  resetIn: number
  /** Total limit for the window */
  limit: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and headers info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const existing = rateLimitStore.get(key)

  // If no existing entry or window has expired, create new entry
  if (!existing || existing.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
      limit: config.maxRequests,
    }
  }

  // Increment count
  existing.count++
  const remaining = Math.max(0, config.maxRequests - existing.count)
  const resetIn = Math.ceil((existing.resetTime - now) / 1000)

  // Check if limit exceeded
  if (existing.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn,
      limit: config.maxRequests,
    }
  }

  return {
    success: true,
    remaining,
    resetIn,
    limit: config.maxRequests,
  }
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetIn.toString(),
  }
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /** Registration endpoint: 10 requests per minute */
  registration: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  /** API general: 100 requests per minute */
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  /** Login attempts: 5 per minute */
  login: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
} as const
