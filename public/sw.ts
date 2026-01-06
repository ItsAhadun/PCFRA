/// <reference lib="webworker" />

/**
 * PCFRA Service Worker
 * Provides offline caching and background sync capabilities
 */

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'pcfra-v1'
const STATIC_CACHE = 'pcfra-static-v1'
const DYNAMIC_CACHE = 'pcfra-dynamic-v1'

// Static assets to cache immediately
const STATIC_ASSETS = ['/', '/dashboard', '/manifest.json', '/favicon.ico']

// API routes to cache with network-first strategy
const API_ROUTES = ['/api/']

// ============================================
// Install Event
// ============================================

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  // Activate immediately
  self.skipWaiting()
})

// ============================================
// Activate Event
// ============================================

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          }),
      )
    }),
  )
  // Take control of all pages immediately
  self.clients.claim()
})

// ============================================
// Fetch Event
// ============================================

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Skip Supabase API calls - let them go through normally
  if (url.hostname.includes('supabase')) {
    return
  }

  // API routes: Network first, cache fallback
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets: Cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigation requests: Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(async () => {
        const cached = await caches.match('/')
        return cached || new Response('Offline', { status: 503 })
      }),
    )
    return
  }

  // Default: Stale while revalidate
  event.respondWith(staleWhileRevalidate(request))
})

// ============================================
// Caching Strategies
// ============================================

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cached = await caches.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, response.clone())
        })
      }
      return response
    })
    .catch(() => cached || new Response('', { status: 503 }))

  return cached || fetchPromise
}

// ============================================
// Helper Functions
// ============================================

function isStaticAsset(pathname: string): boolean {
  const staticExtensions = [
    '.js',
    '.css',
    '.woff',
    '.woff2',
    '.ttf',
    '.ico',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
  ]
  return staticExtensions.some((ext) => pathname.endsWith(ext))
}

// ============================================
// Message Handling
// ============================================

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)))
      }),
    )
  }
})

// ============================================
// Background Sync (if supported)
// ============================================

// @ts-expect-error - Background Sync API types not fully supported
self.addEventListener(
  'sync',
  (event: { tag: string; waitUntil: (p: Promise<void>) => void }) => {
    if (event.tag === 'sync-queue') {
      event.waitUntil(syncOfflineChanges())
    }
  },
)

async function syncOfflineChanges(): Promise<void> {
  // This will be handled by the main thread sync manager
  // Just notify clients that sync is needed
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_NEEDED' })
  })
}

// Export empty to make TypeScript treat as module
export {}
