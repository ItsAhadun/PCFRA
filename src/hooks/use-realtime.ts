'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import type {
  RealtimeChannel,
  RealtimePresenceState,
} from '@supabase/supabase-js'

// ============================================
// Types
// ============================================

export interface PresenceUser {
  id: string
  email?: string
  name?: string
  avatar_url?: string
  online_at: string
  editing?: boolean
}

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T | null
}

// ============================================
// useRealtimeSubscription - Generic realtime subscription
// ============================================

interface UseRealtimeOptions<T> {
  table: string
  filter?: string
  onInsert?: (record: T) => void
  onUpdate?: (record: T, old: T | null) => void
  onDelete?: (old: T) => void
  enabled?: boolean
}

export function useRealtimeSubscription<T>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    // Build the channel with optional filter
    const channelName = filter ? `${table}:${filter}` : table

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload as any

          switch (eventType) {
            case 'INSERT':
              onInsert?.(newRecord)
              break
            case 'UPDATE':
              onUpdate?.(newRecord, oldRecord)
              break
            case 'DELETE':
              if (oldRecord) onDelete?.(oldRecord)
              break
          }
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [table, filter, enabled, onInsert, onUpdate, onDelete])

  return { isConnected }
}

// ============================================
// useRealtimeAssessment - Live assessment updates
// ============================================

export function useRealtimeAssessment(assessmentId: string | undefined) {
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const handleUpdate = useCallback(
    (record: { id: string }) => {
      if (record.id === assessmentId) {
        // Invalidate the assessment query to refetch
        queryClient.invalidateQueries({
          queryKey: ['assessments', assessmentId],
        })
        setLastUpdate(new Date())
      }
    },
    [assessmentId, queryClient],
  )

  const { isConnected } = useRealtimeSubscription({
    table: 'assessments',
    filter: assessmentId ? `id=eq.${assessmentId}` : undefined,
    onUpdate: handleUpdate,
    enabled: !!assessmentId,
  })

  return { isConnected, lastUpdate }
}

// ============================================
// useRealtimeHazards - Live hazard updates for an assessment
// ============================================

export function useRealtimeHazards(assessmentId: string | undefined) {
  const queryClient = useQueryClient()

  const invalidateHazards = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['hazards', assessmentId],
    })
  }, [assessmentId, queryClient])

  const { isConnected } = useRealtimeSubscription({
    table: 'hazards',
    filter: assessmentId ? `assessment_id=eq.${assessmentId}` : undefined,
    onInsert: invalidateHazards,
    onUpdate: invalidateHazards,
    onDelete: invalidateHazards,
    enabled: !!assessmentId,
  })

  return { isConnected }
}

// ============================================
// useRealtimePresence - Who's viewing/editing
// ============================================

interface UsePresenceOptions {
  channel: string
  user: PresenceUser
  enabled?: boolean
}

export function useRealtimePresence({
  channel: channelName,
  user,
  enabled = true,
}: UsePresenceOptions) {
  const [presenceState, setPresenceState] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || !user.id) return

    const supabase = createClient()

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>()
        const users = Object.values(state).flat()
        setPresenceState(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            ...user,
            online_at: new Date().toISOString(),
          })
          setIsConnected(true)
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [channelName, user, enabled])

  // Update presence state (e.g., mark as editing)
  const updatePresence = useCallback(
    async (updates: Partial<PresenceUser>) => {
      if (channelRef.current) {
        await channelRef.current.track({
          ...user,
          ...updates,
          online_at: new Date().toISOString(),
        })
      }
    },
    [user],
  )

  // Get other users (excluding current user)
  const otherUsers = presenceState.filter((u) => u.id !== user.id)

  return {
    isConnected,
    presenceState,
    otherUsers,
    updatePresence,
  }
}

// ============================================
// useAssessmentPresence - Convenience hook for assessment pages
// ============================================

export function useAssessmentPresence(
  assessmentId: string | undefined,
  currentUser: { id: string; email?: string; name?: string } | null,
) {
  const user: PresenceUser = {
    id: currentUser?.id || '',
    email: currentUser?.email,
    name: currentUser?.name,
    online_at: new Date().toISOString(),
    editing: false,
  }

  return useRealtimePresence({
    channel: `assessment:${assessmentId}`,
    user,
    enabled: !!assessmentId && !!currentUser,
  })
}

// ============================================
// useSiteUpdates - Live updates for sites list
// ============================================

export function useSiteUpdates() {
  const queryClient = useQueryClient()

  const invalidateSites = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sites'] })
  }, [queryClient])

  const { isConnected } = useRealtimeSubscription({
    table: 'sites',
    onInsert: invalidateSites,
    onUpdate: invalidateSites,
    onDelete: invalidateSites,
    enabled: true,
  })

  return { isConnected }
}

// ============================================
// useTenantUpdates - Live updates for tenants
// ============================================

export function useTenantUpdates(siteId?: string) {
  const queryClient = useQueryClient()

  const invalidateTenants = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tenants'] })
  }, [queryClient])

  const { isConnected } = useRealtimeSubscription({
    table: 'tenants',
    filter: siteId ? `site_id=eq.${siteId}` : undefined,
    onInsert: invalidateTenants,
    onUpdate: invalidateTenants,
    onDelete: invalidateTenants,
    enabled: true,
  })

  return { isConnected }
}
