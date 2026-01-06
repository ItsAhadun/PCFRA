/**
 * IndexedDB Wrapper for Offline Storage
 * Uses the 'idb' library for a cleaner Promise-based API
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Site, Assessment, Tenant, Hazard, Action } from '@/types'

// ============================================
// Database Schema
// ============================================

interface PCFRADatabase extends DBSchema {
  sites: {
    key: string
    value: Site & { _syncStatus?: 'synced' | 'pending' | 'conflict' }
    indexes: { 'by-user': string }
  }
  assessments: {
    key: string
    value: Assessment & { _syncStatus?: 'synced' | 'pending' | 'conflict' }
    indexes: { 'by-site': string; 'by-user': string }
  }
  tenants: {
    key: string
    value: Tenant & { _syncStatus?: 'synced' | 'pending' | 'conflict' }
    indexes: { 'by-site': string }
  }
  hazards: {
    key: string
    value: Hazard & { _syncStatus?: 'synced' | 'pending' | 'conflict' }
    indexes: { 'by-assessment': string }
  }
  actions: {
    key: string
    value: Action & { _syncStatus?: 'synced' | 'pending' | 'conflict' }
    indexes: { 'by-assessment': string }
  }
  syncQueue: {
    key: string
    value: SyncQueueItem
    indexes: { 'by-timestamp': number }
  }
  metadata: {
    key: string
    value: { key: string; value: unknown; updatedAt: number }
  }
}

export interface SyncQueueItem {
  id: string
  action: 'create' | 'update' | 'delete'
  table: keyof Omit<PCFRADatabase, 'syncQueue' | 'metadata'>
  recordId: string
  data: unknown
  timestamp: number
  retries: number
  lastError?: string
}

// ============================================
// Database Initialization
// ============================================

const DB_NAME = 'pcfra-offline'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<PCFRADatabase> | null = null

export async function getDB(): Promise<IDBPDatabase<PCFRADatabase>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<PCFRADatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Sites store
      if (!db.objectStoreNames.contains('sites')) {
        const sitesStore = db.createObjectStore('sites', { keyPath: 'id' })
        sitesStore.createIndex('by-user', 'user_id')
      }

      // Assessments store
      if (!db.objectStoreNames.contains('assessments')) {
        const assessmentsStore = db.createObjectStore('assessments', {
          keyPath: 'id',
        })
        assessmentsStore.createIndex('by-site', 'site_id')
        assessmentsStore.createIndex('by-user', 'user_id')
      }

      // Tenants store
      if (!db.objectStoreNames.contains('tenants')) {
        const tenantsStore = db.createObjectStore('tenants', { keyPath: 'id' })
        tenantsStore.createIndex('by-site', 'site_id')
      }

      // Hazards store
      if (!db.objectStoreNames.contains('hazards')) {
        const hazardsStore = db.createObjectStore('hazards', { keyPath: 'id' })
        hazardsStore.createIndex('by-assessment', 'assessment_id')
      }

      // Actions store
      if (!db.objectStoreNames.contains('actions')) {
        const actionsStore = db.createObjectStore('actions', { keyPath: 'id' })
        actionsStore.createIndex('by-assessment', 'assessment_id')
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
        syncStore.createIndex('by-timestamp', 'timestamp')
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' })
      }
    },
  })

  return dbInstance
}

// ============================================
// Generic CRUD Operations
// ============================================

type TableName = keyof Omit<PCFRADatabase, 'syncQueue' | 'metadata'>

export async function getAll<T>(table: TableName): Promise<T[]> {
  const db = await getDB()
  // @ts-expect-error - Dynamic table access
  return (await db.getAll(table)) as T[]
}

export async function getById<T>(
  table: TableName,
  id: string,
): Promise<T | undefined> {
  const db = await getDB()
  // @ts-expect-error - Dynamic table access
  return (await db.get(table, id)) as T | undefined
}

export async function getByIndex<T>(
  table: TableName,
  indexName: string,
  value: string,
): Promise<T[]> {
  const db = await getDB()
  // @ts-expect-error - Dynamic index access
  return (await db.getAllFromIndex(table, indexName, value)) as T[]
}

export async function put<T extends { id: string }>(
  table: TableName,
  record: T,
  syncStatus: 'synced' | 'pending' = 'synced',
): Promise<void> {
  const db = await getDB()
  // @ts-expect-error - Adding sync status
  await db.put(table, { ...record, _syncStatus: syncStatus })
}

export async function putMany<T extends { id: string }>(
  table: TableName,
  records: T[],
  syncStatus: 'synced' | 'pending' = 'synced',
): Promise<void> {
  const db = await getDB()
  // @ts-expect-error - Dynamic table access
  const tx = db.transaction(table, 'readwrite')

  for (const record of records) {
    // @ts-expect-error - Adding sync status
    await tx.store.put({ ...record, _syncStatus: syncStatus })
  }

  await tx.done
}

export async function deleteRecord(
  table: TableName,
  id: string,
): Promise<void> {
  const db = await getDB()
  // @ts-expect-error - Dynamic table access
  await db.delete(table, id)
}

export async function clearTable(table: TableName): Promise<void> {
  const db = await getDB()
  // @ts-expect-error - Dynamic table access
  await db.clear(table)
}

// ============================================
// Sync Queue Operations
// ============================================

export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id'>,
): Promise<void> {
  const db = await getDB()
  const id = `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`
  await db.put('syncQueue', { ...item, id })
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  return db.getAllFromIndex('syncQueue', 'by-timestamp')
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('syncQueue', id)
}

export async function updateSyncQueueItem(
  id: string,
  updates: Partial<SyncQueueItem>,
): Promise<void> {
  const db = await getDB()
  const item = await db.get('syncQueue', id)
  if (item) {
    await db.put('syncQueue', { ...item, ...updates })
  }
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB()
  await db.clear('syncQueue')
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB()
  return db.count('syncQueue')
}

// ============================================
// Metadata Operations
// ============================================

export async function setMetadata(key: string, value: unknown): Promise<void> {
  const db = await getDB()
  await db.put('metadata', { key, value, updatedAt: Date.now() })
}

export async function getMetadata<T>(key: string): Promise<T | undefined> {
  const db = await getDB()
  const record = await db.get('metadata', key)
  return record?.value as T | undefined
}

// ============================================
// Convenience Functions
// ============================================

export async function getSitesCached(): Promise<Site[]> {
  return getAll<Site>('sites')
}

export async function getAssessmentsCached(
  siteId?: string,
): Promise<Assessment[]> {
  if (siteId) {
    return getByIndex<Assessment>('assessments', 'by-site', siteId)
  }
  return getAll<Assessment>('assessments')
}

export async function getTenantsCached(siteId: string): Promise<Tenant[]> {
  return getByIndex<Tenant>('tenants', 'by-site', siteId)
}

export async function getHazardsCached(
  assessmentId: string,
): Promise<Hazard[]> {
  return getByIndex<Hazard>('hazards', 'by-assessment', assessmentId)
}

export async function getActionsCached(
  assessmentId: string,
): Promise<Action[]> {
  return getByIndex<Action>('actions', 'by-assessment', assessmentId)
}

// ============================================
// Cache All Data for Offline Use
// ============================================

export async function cacheAllData(data: {
  sites?: Site[]
  assessments?: Assessment[]
  tenants?: Tenant[]
  hazards?: Hazard[]
  actions?: Action[]
}): Promise<void> {
  if (data.sites) await putMany('sites', data.sites)
  if (data.assessments) await putMany('assessments', data.assessments)
  if (data.tenants) await putMany('tenants', data.tenants)
  if (data.hazards) await putMany('hazards', data.hazards)
  if (data.actions) await putMany('actions', data.actions)

  await setMetadata('lastCacheTime', Date.now())
}

export async function getLastCacheTime(): Promise<number | undefined> {
  return getMetadata<number>('lastCacheTime')
}
