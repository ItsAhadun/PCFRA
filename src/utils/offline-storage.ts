/**
 * Offline Storage Utility
 * Provides localStorage-based data persistence with sync queue
 */

import { v4 as uuidv4 } from 'uuid'

const STORAGE_PREFIX = 'pcfra_'
const SYNC_QUEUE_KEY = `${STORAGE_PREFIX}sync_queue`

export interface SyncQueueItem {
  id: string
  action: 'create' | 'update' | 'delete'
  entity: string
  data: unknown
  timestamp: number
  retries: number
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/**
 * Get item from localStorage with type safety
 */
export function getStorageItem<T>(key: string): T | null {
  if (!isBrowser()) return null

  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error)
    return null
  }
}

/**
 * Set item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (!isBrowser()) return

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error)
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  if (!isBrowser()) return

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error)
  }
}

/**
 * Get all items matching a prefix
 */
export function getStorageItemsByPrefix<T>(prefix: string): Record<string, T> {
  if (!isBrowser()) return {}

  const items: Record<string, T> = {}
  const fullPrefix = `${STORAGE_PREFIX}${prefix}`

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(fullPrefix)) {
      try {
        const item = localStorage.getItem(key)
        if (item) {
          items[key.replace(STORAGE_PREFIX, '')] = JSON.parse(item)
        }
      } catch (error) {
        console.error(`Error reading item: ${key}`, error)
      }
    }
  }

  return items
}

/**
 * Clear all PCFRA items from localStorage
 */
export function clearAllStorage(): void {
  if (!isBrowser()) return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

// ============================================
// Sync Queue Management
// ============================================

/**
 * Get the current sync queue
 */
export function getSyncQueue(): SyncQueueItem[] {
  return getStorageItem<SyncQueueItem[]>('sync_queue') || []
}

/**
 * Add item to sync queue
 */
export function addToSyncQueue(
  action: 'create' | 'update' | 'delete',
  entity: string,
  data: unknown,
): void {
  const queue = getSyncQueue()

  const item: SyncQueueItem = {
    id: uuidv4(),
    action,
    entity,
    data,
    timestamp: Date.now(),
    retries: 0,
  }

  queue.push(item)
  setStorageItem('sync_queue', queue)
}

/**
 * Remove item from sync queue
 */
export function removeFromSyncQueue(id: string): void {
  const queue = getSyncQueue()
  const filtered = queue.filter((item) => item.id !== id)
  setStorageItem('sync_queue', filtered)
}

/**
 * Update item retry count in sync queue
 */
export function incrementSyncRetry(id: string): void {
  const queue = getSyncQueue()
  const updated = queue.map((item) =>
    item.id === id ? { ...item, retries: item.retries + 1 } : item,
  )
  setStorageItem('sync_queue', updated)
}

/**
 * Clear the entire sync queue
 */
export function clearSyncQueue(): void {
  setStorageItem('sync_queue', [])
}

/**
 * Check if there are pending items in sync queue
 */
export function hasPendingSync(): boolean {
  return getSyncQueue().length > 0
}

/**
 * Get count of pending sync items
 */
export function getPendingSyncCount(): number {
  return getSyncQueue().length
}

// ============================================
// Draft Assessment Storage
// ============================================

const DRAFT_PREFIX = 'draft_assessment_'

/**
 * Save assessment draft
 */
export function saveDraft(assessmentId: string, data: unknown): void {
  setStorageItem(`${DRAFT_PREFIX}${assessmentId}`, {
    data,
    savedAt: Date.now(),
  })
}

/**
 * Get assessment draft
 */
export function getDraft<T>(
  assessmentId: string,
): { data: T; savedAt: number } | null {
  return getStorageItem(`${DRAFT_PREFIX}${assessmentId}`)
}

/**
 * Remove assessment draft
 */
export function removeDraft(assessmentId: string): void {
  removeStorageItem(`${DRAFT_PREFIX}${assessmentId}`)
}

/**
 * Get all draft assessments
 */
export function getAllDrafts(): Record<
  string,
  { data: unknown; savedAt: number }
> {
  return getStorageItemsByPrefix(DRAFT_PREFIX)
}

// ============================================
// Online Status Detection
// ============================================

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  if (!isBrowser()) return true
  return navigator.onLine
}

/**
 * Add online/offline event listeners
 */
export function addConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  if (!isBrowser()) return () => {}

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}
