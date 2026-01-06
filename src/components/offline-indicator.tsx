'use client'

import { useOnlineStatus } from '@/hooks/use-service-worker'
import { useOfflineSync } from '@/utils/offline-sync-manager'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface OfflineIndicatorProps {
  className?: string
  showSyncButton?: boolean
}

/**
 * Compact offline indicator for header/navbar
 */
export function OfflineIndicator({
  className,
  showSyncButton = true,
}: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus()
  const { isSyncing, pendingCount, syncNow } = useOfflineSync()

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
                isOnline
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              )}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline
              ? 'Connected to the internet'
              : 'Working offline - changes will sync when connected'}
          </TooltipContent>
        </Tooltip>

        {/* Pending Sync Count */}
        {pendingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                <CloudOff className="h-3 w-3" />
                <span>{pendingCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} waiting
              to sync
            </TooltipContent>
          </Tooltip>
        )}

        {/* Sync Button */}
        {showSyncButton && pendingCount > 0 && isOnline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={syncNow}
                disabled={isSyncing}
              >
                <RefreshCw
                  className={cn('h-3 w-3', isSyncing && 'animate-spin')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isSyncing ? 'Syncing...' : 'Sync now'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Syncing Indicator */}
        {isSyncing && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">Syncing...</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Full-width offline banner for prominent display
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const { pendingCount } = useOfflineSync()

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={cn(
        'w-full px-4 py-2 text-center text-sm font-medium',
        isOnline
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      )}
    >
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>
            You&apos;re offline. Changes will be saved locally and synced when
            you&apos;re back online.
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <Cloud className="h-4 w-4" />
          <span>
            {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} waiting
            to sync...
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Floating offline indicator for bottom corner
 */
export function FloatingOfflineIndicator() {
  const isOnline = useOnlineStatus()
  const { isSyncing, pendingCount, syncNow } = useOfflineSync()

  // Only show when offline or has pending items
  if (isOnline && pendingCount === 0 && !isSyncing) return null

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div
        className={cn(
          'flex items-center gap-3 rounded-full px-4 py-2 shadow-lg',
          isOnline ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white',
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Syncing...</span>
          </>
        ) : (
          <>
            <CloudOff className="h-4 w-4" />
            <span className="text-sm font-medium">{pendingCount} pending</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 rounded-full bg-white/20 px-2 text-xs hover:bg-white/30"
              onClick={syncNow}
            >
              Sync
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
