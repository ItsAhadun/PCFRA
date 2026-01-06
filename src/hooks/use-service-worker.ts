'use client'

import { useState, useEffect, useCallback } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isUpdateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

/**
 * Hook to register and manage Service Worker lifecycle
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>(() => ({
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
  }))

  useEffect(() => {
    // Skip if Service Workers are not supported
    if (!state.isSupported) {
      return
    }

    // Register the Service Worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }))

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                setState((prev) => ({ ...prev, isUpdateAvailable: true }))
              }
            })
          }
        })

        // Handle controller change (new SW activated)
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true
            window.location.reload()
          }
        })
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  /**
   * Skip waiting and activate the new Service Worker
   */
  const updateServiceWorker = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [state.registration])

  /**
   * Unregister the Service Worker
   */
  const unregisterServiceWorker = useCallback(async () => {
    if (state.registration) {
      await state.registration.unregister()
      setState((prev) => ({
        ...prev,
        isRegistered: false,
        registration: null,
      }))
    }
  }, [state.registration])

  return {
    ...state,
    updateServiceWorker,
    unregisterServiceWorker,
  }
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
