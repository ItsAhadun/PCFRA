'use client'

import { cn } from '@/lib/utils'
import type { PresenceUser } from '@/hooks/use-realtime'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PresenceIndicatorProps {
  users: PresenceUser[]
  maxVisible?: number
  className?: string
}

/**
 * Avatar stack showing users currently viewing/editing
 */
export function PresenceIndicator({
  users,
  maxVisible = 3,
  className,
}: PresenceIndicatorProps) {
  if (users.length === 0) return null

  const visibleUsers = users.slice(0, maxVisible)
  const remainingCount = users.length - maxVisible

  return (
    <TooltipProvider>
      <div className={cn('flex items-center -space-x-2', className)}>
        {visibleUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'relative h-8 w-8 rounded-full border-2 border-white dark:border-gray-900',
                  'flex items-center justify-center text-xs font-medium',
                  user.editing
                    ? 'bg-green-500 text-white ring-2 ring-green-300'
                    : 'bg-blue-500 text-white',
                )}
              >
                {getInitials(user.name || user.email || 'U')}
                {user.editing && (
                  <span className="absolute -right-1 -bottom-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-green-400" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">
                {user.name || user.email || 'Anonymous'}
              </p>
              <p className="text-muted-foreground text-xs">
                {user.editing ? 'Editing...' : 'Viewing'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-xs font-medium text-white dark:border-gray-900">
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more users viewing</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Compact indicator showing count only
 */
export function PresenceCount({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  if (count === 0) return null

  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center gap-1.5 text-sm',
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      {count} {count === 1 ? 'user' : 'users'} online
    </div>
  )
}

/**
 * Live indicator dot
 */
export function LiveIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      <span className="font-medium text-red-500">LIVE</span>
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
