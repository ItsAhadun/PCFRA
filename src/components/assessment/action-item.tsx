'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Calendar,
  User,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import type { Action, Priority } from '@/types'
import { format, isPast, isToday } from 'date-fns'

interface ActionItemProps {
  action: Action
  onEdit?: () => void
  onDelete?: () => void
  onStatusChange?: (completed: boolean) => void
  showActions?: boolean
  className?: string
}

const PRIORITY_CONFIG: Record<Priority, { color: string; label: string }> = {
  critical: { color: 'bg-red-500 text-white', label: 'Critical' },
  high: { color: 'bg-orange-500 text-white', label: 'High' },
  medium: { color: 'bg-yellow-500 text-black', label: 'Medium' },
  low: { color: 'bg-green-500 text-white', label: 'Low' },
}

export function ActionItem({
  action,
  onEdit,
  onDelete,
  onStatusChange,
  showActions = true,
  className,
}: ActionItemProps) {
  const isCompleted = action.status === 'completed'
  const isOverdue =
    action.target_date && isPast(new Date(action.target_date)) && !isCompleted
  const isDueToday = action.target_date && isToday(new Date(action.target_date))

  const priorityConfig = PRIORITY_CONFIG[action.priority]

  return (
    <Card
      className={cn(
        'relative transition-all',
        isCompleted && 'opacity-60',
        isOverdue && 'border-red-500 ring-1 ring-red-500/20',
        className,
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        {/* Completion checkbox */}
        {onStatusChange && (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onStatusChange(!!checked)}
            className="mt-1"
          />
        )}

        <div className="flex-1 space-y-2">
          {/* Header with priority */}
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm font-medium',
                isCompleted && 'line-through',
              )}
            >
              {action.action_description}
            </p>
            <Badge className={cn('shrink-0', priorityConfig.color)}>
              {priorityConfig.label}
            </Badge>
          </div>

          {/* Meta info */}
          <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
            {action.assigned_to && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{action.assigned_to}</span>
                {action.assigned_role && (
                  <span className="text-muted-foreground/60">
                    ({action.assigned_role})
                  </span>
                )}
              </div>
            )}

            {action.target_date && (
              <div
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'font-medium text-red-500',
                  isDueToday && 'font-medium text-yellow-600',
                )}
              >
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(action.target_date), 'MMM d, yyyy')}
                </span>
                {isOverdue && <AlertTriangle className="ml-1 h-3 w-3" />}
                {isDueToday && !isOverdue && <Clock className="ml-1 h-3 w-3" />}
              </div>
            )}
          </div>

          {/* Completion notes */}
          {isCompleted && action.completion_notes && (
            <div className="bg-muted rounded p-2 text-xs">
              <p className="text-muted-foreground mb-1 font-medium">
                Completion Notes:
              </p>
              <p>{action.completion_notes}</p>
            </div>
          )}

          {/* Status badges */}
          <div className="flex gap-2">
            {isCompleted && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Completed
                {action.completed_at && (
                  <span className="ml-1 opacity-70">
                    on {format(new Date(action.completed_at), 'MMM d')}
                  </span>
                )}
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Overdue
              </Badge>
            )}
            {isDueToday && !isCompleted && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                <Clock className="mr-1 h-3 w-3" />
                Due Today
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-1">
            {onEdit && !isCompleted && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Action?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this action item. This cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact action list for summary views
 */
export function ActionListItem({
  action,
  onClick,
  className,
}: {
  action: Action
  onClick?: () => void
  className?: string
}) {
  const isCompleted = action.status === 'completed'
  const isOverdue =
    action.target_date && isPast(new Date(action.target_date)) && !isCompleted
  const priorityConfig = PRIORITY_CONFIG[action.priority]

  return (
    <button
      onClick={onClick}
      className={cn(
        'hover:bg-muted flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
        isOverdue && 'border-red-500',
        isCompleted && 'opacity-60',
        className,
      )}
    >
      {isCompleted ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <div
          className={cn('h-4 w-4 shrink-0 rounded-full', priorityConfig.color)}
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium',
            isCompleted && 'line-through',
          )}
        >
          {action.action_description}
        </p>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {action.assigned_to && <span>{action.assigned_to}</span>}
          {action.target_date && (
            <span className={isOverdue ? 'text-red-500' : ''}>
              {format(new Date(action.target_date), 'MMM d')}
            </span>
          )}
        </div>
      </div>
      {isOverdue && <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />}
    </button>
  )
}

/**
 * Action stats summary
 */
export function ActionStats({
  pending,
  overdue,
  completed,
  className,
}: {
  pending: number
  overdue: number
  completed: number
  className?: string
}) {
  const total = pending + overdue + completed

  return (
    <div className={cn('grid grid-cols-3 gap-4 text-center', className)}>
      <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30">
        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
          {pending}
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
      </div>
      <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
          {overdue}
        </p>
        <p className="text-xs text-red-600 dark:text-red-400">Overdue</p>
      </div>
      <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
          {completed}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
      </div>
    </div>
  )
}
