'use client'

import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { AlertCircle, RefreshCw, Users, Pencil } from 'lucide-react'

/**
 * Toast notification for when someone else edits the current record
 */
export function showExternalEditToast(
  entityType: string,
  onRefresh?: () => void,
) {
  toast.warning(`${entityType} was updated`, {
    description: 'Someone else made changes to this record.',
    icon: <Pencil className="h-4 w-4" />,
    action: onRefresh
      ? {
          label: 'Refresh',
          onClick: onRefresh,
        }
      : undefined,
    duration: 5000,
  })
}

/**
 * Toast notification for when a new record is created
 */
export function showNewRecordToast(entityType: string, name?: string) {
  toast.info(`New ${entityType} created`, {
    description: name
      ? `"${name}" was added.`
      : `A new ${entityType} was added.`,
    duration: 4000,
  })
}

/**
 * Toast notification for when a record is deleted
 */
export function showDeletedRecordToast(entityType: string, name?: string) {
  toast.error(`${entityType} deleted`, {
    description: name
      ? `"${name}" was removed.`
      : `A ${entityType} was removed.`,
    duration: 4000,
  })
}

/**
 * Toast notification for user presence changes
 */
export function showUserJoinedToast(userName: string) {
  toast(`${userName} joined`, {
    icon: <Users className="h-4 w-4 text-green-500" />,
    duration: 3000,
  })
}

export function showUserLeftToast(userName: string) {
  toast(`${userName} left`, {
    icon: <Users className="h-4 w-4 text-gray-500" />,
    duration: 3000,
  })
}

/**
 * Toast notification for connection status
 */
export function showConnectionToast(isConnected: boolean) {
  if (isConnected) {
    toast.success('Connected', {
      description: 'Real-time updates enabled.',
      duration: 2000,
    })
  } else {
    toast.error('Disconnected', {
      description: 'Real-time updates paused. Trying to reconnect...',
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 5000,
    })
  }
}

/**
 * Toast notification for conflict
 */
export function showConflictToast(onReload: () => void) {
  toast.error('Edit conflict detected', {
    description:
      'Your changes conflict with updates from another user. Please reload to see the latest version.',
    icon: <AlertCircle className="h-4 w-4" />,
    action: {
      label: 'Reload',
      onClick: onReload,
    },
    duration: Infinity, // Keep until dismissed
  })
}

/**
 * Hook to handle realtime notifications for a specific entity
 */
interface UseRealtimeNotificationsOptions {
  entityType: string
  currentRecordId?: string
  onExternalUpdate?: () => void
  enabled?: boolean
}

export function useRealtimeNotifications({
  entityType,
  currentRecordId,
  onExternalUpdate,
  enabled = true,
}: UseRealtimeNotificationsOptions) {
  const handleExternalUpdate = useCallback(
    (recordId: string) => {
      if (currentRecordId && recordId === currentRecordId) {
        showExternalEditToast(entityType, onExternalUpdate)
      }
    },
    [entityType, currentRecordId, onExternalUpdate],
  )

  return { handleExternalUpdate }
}
