'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { RiskScore, RiskLevel, Hazard } from '@/types'
import {
  getRiskLevel,
  generateRiskMatrix,
  getRiskColorClass,
} from '@/utils/risk-calculator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RiskMatrixProps {
  hazards?: Hazard[]
  selectedCell?: { severity: RiskScore; likelihood: RiskScore }
  onCellClick?: (severity: RiskScore, likelihood: RiskScore) => void
  interactive?: boolean
  className?: string
}

export function RiskMatrix({
  hazards = [],
  selectedCell,
  onCellClick,
  interactive = false,
  className,
}: RiskMatrixProps) {
  // Count hazards per cell
  const hazardCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    hazards.forEach((h) => {
      const key = `${h.severity}-${h.likelihood}`
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [hazards])

  const matrix = useMemo(() => generateRiskMatrix(), [])

  const getCellColor = (level: RiskLevel): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-500 hover:bg-red-600'
      case 'high':
        return 'bg-orange-500 hover:bg-orange-600'
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'low':
        return 'bg-green-500 hover:bg-green-600'
    }
  }

  return (
    <div className={cn('', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Risk Matrix</h3>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-green-500" />
            Low (1-4)
          </span>
          <span className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-yellow-500" />
            Medium (5-9)
          </span>
          <span className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-orange-500" />
            High (10-14)
          </span>
          <span className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-red-500" />
            Critical (15-25)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse">
          <thead>
            <tr>
              <th
                className="bg-muted border p-2 text-xs font-medium"
                rowSpan={2}
              >
                Severity
              </th>
              <th
                className="bg-muted border p-2 text-center text-xs font-medium"
                colSpan={5}
              >
                Likelihood
              </th>
            </tr>
            <tr>
              {[1, 2, 3, 4, 5].map((l) => (
                <th
                  key={l}
                  className="bg-muted w-16 border p-2 text-center text-xs font-medium"
                >
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((severity) => (
              <tr key={severity}>
                <th className="bg-muted w-16 border p-2 text-center text-xs font-medium">
                  {severity}
                </th>
                {[1, 2, 3, 4, 5].map((likelihood) => {
                  const score = severity * likelihood
                  const level = getRiskLevel(score)
                  const key = `${severity}-${likelihood}`
                  const count = hazardCounts[key] || 0
                  const isSelected =
                    selectedCell?.severity === severity &&
                    selectedCell?.likelihood === likelihood

                  return (
                    <TooltipProvider key={likelihood}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <td
                            className={cn(
                              'border p-2 text-center transition-all',
                              getCellColor(level),
                              interactive && 'cursor-pointer',
                              isSelected && 'ring-primary ring-2 ring-offset-2',
                            )}
                            onClick={() =>
                              interactive &&
                              onCellClick?.(
                                severity as RiskScore,
                                likelihood as RiskScore,
                              )
                            }
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-bold text-white">
                                {score}
                              </span>
                              {count > 0 && (
                                <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-medium text-white">
                                  {count}
                                </span>
                              )}
                            </div>
                          </td>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">Risk Score: {score}</p>
                          <p className="text-muted-foreground text-xs capitalize">
                            Level: {level}
                          </p>
                          {count > 0 && (
                            <p className="text-xs">{count} hazard(s)</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-1 font-medium">Severity (S)</p>
          <ul className="text-muted-foreground space-y-0.5 text-xs">
            <li>1 - Negligible</li>
            <li>2 - Slight</li>
            <li>3 - Moderate</li>
            <li>4 - Severe</li>
            <li>5 - Catastrophic</li>
          </ul>
        </div>
        <div>
          <p className="mb-1 font-medium">Likelihood (L)</p>
          <ul className="text-muted-foreground space-y-0.5 text-xs">
            <li>1 - Rare</li>
            <li>2 - Unlikely</li>
            <li>3 - Possible</li>
            <li>4 - Likely</li>
            <li>5 - Almost Certain</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact risk indicator badge
 */
export function RiskBadge({
  level,
  score,
  className,
}: {
  level: RiskLevel
  score?: number
  className?: string
}) {
  const colors = getRiskColorClass(level)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white',
        colors.bg,
        className,
      )}
    >
      {score !== undefined && <span>{score}</span>}
      <span className="capitalize">{level}</span>
    </span>
  )
}
