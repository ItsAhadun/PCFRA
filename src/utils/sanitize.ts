/**
 * Input sanitization utilities to prevent XSS and ensure data integrity.
 */

/**
 * Sanitize a string by:
 * - Trimming whitespace
 * - Removing HTML tags
 * - Escaping special characters that could be used for injection
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return ''

  return (
    input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Escape special HTML characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  )
}

/**
 * Sanitize a string for safe display (lighter sanitization for output)
 * Only removes script tags and HTML, keeps most other content
 */
export function sanitizeForDisplay(input: string | undefined | null): string {
  if (!input) return ''

  return (
    input
      .trim()
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
  )
}

/**
 * Sanitize and normalize a phone number
 * Keeps only digits, plus sign, spaces, and common separators
 */
export function sanitizePhone(input: string | undefined | null): string {
  if (!input) return ''

  return (
    input
      .trim()
      // Keep only digits, plus sign, spaces, hyphens, and parentheses
      .replace(/[^\d+\s\-()]/g, '')
      // Normalize multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/**
 * Sanitize and normalize an email address
 */
export function sanitizeEmail(input: string | undefined | null): string {
  if (!input) return ''

  const trimmed = input.trim().toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return '' // Return empty if not a valid email format
  }

  return trimmed
}

/**
 * Sanitize a number input
 * Returns the number if valid, or undefined if invalid
 */
export function sanitizeNumber(
  input: string | number | undefined | null,
): number | undefined {
  if (input === null || input === undefined || input === '') {
    return undefined
  }

  const num = typeof input === 'number' ? input : parseFloat(String(input))

  if (isNaN(num)) {
    return undefined
  }

  return num
}

/**
 * Sanitize an integer input
 */
export function sanitizeInteger(
  input: string | number | undefined | null,
): number | undefined {
  const num = sanitizeNumber(input)
  if (num === undefined) return undefined
  return Math.floor(num)
}

/**
 * Sanitize all string properties in an object
 */
export function sanitizeFormData<T extends object>(data: T): T {
  const result = { ...data } as Record<string, unknown>

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      // Apply different sanitization based on field name
      if (key.includes('email')) {
        ;(result as Record<string, unknown>)[key] = sanitizeEmail(value)
      } else if (key.includes('phone')) {
        ;(result as Record<string, unknown>)[key] = sanitizePhone(value)
      } else {
        ;(result as Record<string, unknown>)[key] = sanitizeForDisplay(value)
      }
    }
  }

  return result as T
}

/**
 * Validate and sanitize a UUID
 */
export function sanitizeUuid(input: string | undefined | null): string | null {
  if (!input) return null

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const trimmed = input.trim()

  if (!uuidRegex.test(trimmed)) {
    return null
  }

  return trimmed.toLowerCase()
}

/**
 * Sanitize a postcode (UK format)
 */
export function sanitizePostcode(input: string | undefined | null): string {
  if (!input) return ''

  return input
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}
