/**
 * Offline Sync Manager
 * Handles background synchronization of offline changes
 */

import {
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
  getSyncQueueCount,
  type SyncQueueItem,
} from './indexed-db'
import { createClient } from '@/supabase/client'

// ============================================
// Configuration
// ============================================

const MAX_RETRIES = 5
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000] // Exponential backoff

type SyncEventType = 'start' | 'progress' | 'success' | 'error' | 'complete'

interface SyncEvent {
  type: SyncEventType
  itemId?: string
  total?: number
  completed?: number
  error?: string
}

type SyncListener = (event: SyncEvent) => void

// ============================================
// Sync Manager Class
// ============================================

class OfflineSyncManager {
  private isSyncing = false
  private listeners: Set<SyncListener> = new Set()
  private syncInterval: NodeJS.Timeout | null = null

  /**
   * Subscribe to sync events
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: SyncEvent): void {
    this.listeners.forEach((listener) => listener(event))
  }

  /**
   * Start automatic sync when online
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (typeof window === 'undefined') return

    // Sync immediately if online
    if (navigator.onLine) {
      this.sync()
    }

    // Listen for online events
    window.addEventListener('online', () => this.sync())

    // Periodic sync
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync()
      }
    }, intervalMs)
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Process the sync queue
   */
  async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0 }
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: 0, failed: 0 }
    }

    this.isSyncing = true
    let success = 0
    let failed = 0

    try {
      const queue = await getSyncQueue()

      if (queue.length === 0) {
        this.isSyncing = false
        return { success: 0, failed: 0 }
      }

      this.emit({ type: 'start', total: queue.length })

      for (const item of queue) {
        try {
          await this.processSyncItem(item)
          await removeSyncQueueItem(item.id)
          success++
          this.emit({
            type: 'progress',
            itemId: item.id,
            total: queue.length,
            completed: success + failed,
          })
        } catch (error) {
          failed++
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'

          if (item.retries >= MAX_RETRIES) {
            // Move to dead letter queue or mark as failed
            await updateSyncQueueItem(item.id, {
              retries: item.retries + 1,
              lastError: errorMessage,
            })
            this.emit({
              type: 'error',
              itemId: item.id,
              error: `Max retries exceeded: ${errorMessage}`,
            })
          } else {
            // Update retry count
            await updateSyncQueueItem(item.id, {
              retries: item.retries + 1,
              lastError: errorMessage,
            })
          }
        }
      }

      this.emit({ type: 'complete', total: queue.length, completed: success })
    } finally {
      this.isSyncing = false
    }

    return { success, failed }
  }

  /**
   * Process a single sync queue item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const supabase = createClient()
    const { action, table, recordId, data } = item
    const tableName = table as string

    switch (action) {
      case 'create':
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(data as Record<string, unknown>)
        if (insertError) throw new Error(insertError.message)
        break

      case 'update':
        const { error: updateError } = await supabase
          .from(tableName)
          .update(data as Record<string, unknown>)
          .eq('id', recordId)
        if (updateError) throw new Error(updateError.message)
        break

      case 'delete':
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', recordId)
        if (deleteError) throw new Error(deleteError.message)
        break
    }
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<{
    isSyncing: boolean
    pendingCount: number
  }> {
    const pendingCount = await getSyncQueueCount()
    return {
      isSyncing: this.isSyncing,
      pendingCount,
    }
  }

  /**
   * Force retry failed items
   */
  async retryFailed(): Promise<void> {
    const queue = await getSyncQueue()
    const failedItems = queue.filter((item) => item.retries >= MAX_RETRIES)

    for (const item of failedItems) {
      await updateSyncQueueItem(item.id, { retries: 0, lastError: undefined })
    }

    await this.sync()
  }
}

// Singleton instance
export const syncManager = new OfflineSyncManager()

// ============================================
// React Hook
// ============================================

import { useState, useEffect, useCallback } from 'react'

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: number
    failed: number
  } | null>(null)

  useEffect(() => {
    // Update status periodically
    const updateStatus = async () => {
      const status = await syncManager.getStatus()
      setIsSyncing(status.isSyncing)
      setPendingCount(status.pendingCount)
    }

    updateStatus()

    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === 'start') {
        setIsSyncing(true)
      } else if (event.type === 'complete') {
        setIsSyncing(false)
        updateStatus()
      }
    })

    // Start auto sync
    syncManager.startAutoSync()

    return () => {
      unsubscribe()
      syncManager.stopAutoSync()
    }
  }, [])

  const syncNow = useCallback(async () => {
    const result = await syncManager.sync()
    setLastSyncResult(result)
    return result
  }, [])

  const retryFailed = useCallback(async () => {
    await syncManager.retryFailed()
  }, [])

  return {
    isSyncing,
    pendingCount,
    lastSyncResult,
    syncNow,
    retryFailed,
  }
}
