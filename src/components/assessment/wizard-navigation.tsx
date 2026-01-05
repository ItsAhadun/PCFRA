'use client'

import { cn } from '@/lib/utils'
import { Check, Circle, AlertTriangle } from 'lucide-react'
import type { SectionNumber } from '@/types'
import { SECTION_NAMES } from '@/types'
import { Progress } from '@/components/ui/progress'

interface WizardNavigationProps {
  currentSection: SectionNumber
  completedSections: SectionNumber[]
  isHighRise?: boolean
  onSectionClick?: (section: SectionNumber) => void
  className?: string
}

interface SectionInfo {
  number: SectionNumber
  name: string
  highRiseOnly?: boolean
}

const SECTIONS: SectionInfo[] = [
  { number: 1, name: 'Site Information' },
  { number: 2, name: 'Fire Doors' },
  { number: 3, name: 'Hot Works' },
  { number: 4, name: 'Escape Routes' },
  { number: 5, name: 'Fire Detection' },
  { number: 6, name: 'Emergency Procedures' },
  { number: 7, name: 'Hazard Identification' },
  { number: 8, name: 'Action Plan' },
  { number: 9, name: 'Summary' },
  { number: 10, name: 'Sign Off' },
]

export function WizardNavigation({
  currentSection,
  completedSections,
  isHighRise,
  onSectionClick,
  className,
}: WizardNavigationProps) {
  const progressPercent = (completedSections.length / 10) * 100

  const getStepStatus = (section: SectionNumber) => {
    if (completedSections.includes(section)) return 'completed'
    if (section === currentSection) return 'current'
    return 'pending'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Assessment Progress</span>
          <span className="font-medium">
            {completedSections.length}/10 sections
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* High-rise badge */}
      {isHighRise && (
        <div className="flex items-center gap-2 rounded-lg bg-orange-100 p-3 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">High-Rise Building (18m+)</p>
            <p className="text-xs opacity-80">
              Additional Building Safety Act requirements apply
            </p>
          </div>
        </div>
      )}

      {/* Section list */}
      <nav className="space-y-1">
        {SECTIONS.map((section, index) => {
          const status = getStepStatus(section.number)
          const isClickable =
            onSectionClick && (status === 'completed' || status === 'current')

          return (
            <button
              key={section.number}
              onClick={() => isClickable && onSectionClick?.(section.number)}
              disabled={!isClickable}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                status === 'current' && 'bg-primary text-primary-foreground',
                status === 'completed' &&
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
                status === 'pending' && 'text-muted-foreground',
                isClickable && 'cursor-pointer hover:opacity-80',
                !isClickable && 'cursor-default',
              )}
            >
              {/* Step indicator */}
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium',
                  status === 'current' &&
                    'border-primary-foreground bg-primary-foreground text-primary',
                  status === 'completed' &&
                    'border-green-600 bg-green-600 text-white',
                  status === 'pending' && 'border-muted-foreground/30',
                )}
              >
                {status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  section.number
                )}
              </div>

              {/* Section name */}
              <span className="flex-1 text-sm font-medium">{section.name}</span>

              {/* Status indicator */}
              {status === 'current' && (
                <Circle className="h-2 w-2 animate-pulse fill-current" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/**
 * Compact horizontal step indicator for mobile
 */
export function WizardStepIndicator({
  currentSection,
  completedSections,
  totalSections = 10,
  className,
}: {
  currentSection: SectionNumber
  completedSections: SectionNumber[]
  totalSections?: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: totalSections }, (_, i) => {
        const section = (i + 1) as SectionNumber
        const isCompleted = completedSections.includes(section)
        const isCurrent = section === currentSection

        return (
          <div
            key={section}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              isCompleted && 'bg-green-500',
              isCurrent && !isCompleted && 'bg-primary',
              !isCompleted && !isCurrent && 'bg-muted',
            )}
          />
        )
      })}
    </div>
  )
}
