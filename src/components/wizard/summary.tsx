'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import { RiskMatrix, RiskBadge } from '@/components/assessment/risk-matrix'
import { ActionStats } from '@/components/assessment/action-item'
import { calculateOverallRisk } from '@/utils/risk-calculator'
import type { SectionData, SummaryData, Hazard, Action } from '@/types'

interface SummarySectionProps {
  assessmentId: string
  data: SectionData
  hazards?: Hazard[]
  actions?: Action[]
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

export function SummarySection({
  data: initialData,
  hazards = [],
  actions = [],
  onSave,
  onNext,
  isHighRise,
  isSaving,
}: SummarySectionProps) {
  const [data, setData] = useState<SummaryData>(
    (initialData as SummaryData) || {},
  )
  const [isConfirmed, setIsConfirmed] = useState(false)

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(initialData as SummaryData)
    }
  }, [initialData])

  const updateData = (updates: Partial<SummaryData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const overallRisk = calculateOverallRisk(hazards)
  const unresolvedHazards = hazards.filter((h) => !h.is_resolved)
  const criticalHazards = hazards.filter(
    (h) => h.risk_level === 'critical' && !h.is_resolved,
  )

  const actionStats = {
    pending: actions.filter(
      (a) => a.status === 'pending' || a.status === 'in_progress',
    ).length,
    overdue: actions.filter((a) => {
      if (a.status === 'completed') return false
      if (!a.target_date) return false
      return new Date(a.target_date) < new Date()
    }).length,
    completed: actions.filter((a) => a.status === 'completed').length,
  }

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <FileText className="h-5 w-5" />
          Section 9: Summary
        </h2>
        <p className="text-muted-foreground">
          Review the overall assessment findings
        </p>
      </div>

      {/* Overall Risk */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 font-medium">Overall Risk Level</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{overallRisk.score}</div>
            <div>
              <RiskBadge level={overallRisk.level} />
              <p className="text-muted-foreground mt-1 text-sm">
                {overallRisk.isCritical
                  ? 'Requires immediate action'
                  : 'Based on highest identified hazard'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium">
                {unresolvedHazards.length} Unresolved Hazards
              </p>
              <p className="text-muted-foreground text-sm">
                {criticalHazards.length} critical
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">{actions.length} Actions Assigned</p>
              <p className="text-muted-foreground text-sm">
                {actionStats.completed} completed, {actionStats.pending} pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Stats */}
      <ActionStats {...actionStats} />

      {/* Risk Matrix */}
      {hazards.length > 0 && <RiskMatrix hazards={hazards} />}

      {/* High-Rise Notice */}
      {isHighRise && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
          <h4 className="font-medium text-orange-800 dark:text-orange-200">
            High-Rise Building Assessment
          </h4>
          <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
            This assessment covers a high-rise building (18m+). Ensure all
            Golden Thread requirements are met and documentation is maintained
            for the Building Safety Regulator.
          </p>
        </div>
      )}

      {/* Summary Text */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="findings">Overall Findings</Label>
          <Textarea
            id="findings"
            value={data.overall_findings || ''}
            onChange={(e) => updateData({ overall_findings: e.target.value })}
            placeholder="Summarize the key findings of this assessment..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recommendations">Key Recommendations</Label>
          <Textarea
            id="recommendations"
            value={data.key_recommendations || ''}
            onChange={(e) =>
              updateData({ key_recommendations: e.target.value })
            }
            placeholder="List the main recommendations for improving fire safety..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compliance">Compliance Statement</Label>
          <Textarea
            id="compliance"
            value={data.compliance_statement || ''}
            onChange={(e) =>
              updateData({ compliance_statement: e.target.value })
            }
            placeholder="Statement regarding compliance with fire safety regulations..."
            rows={3}
          />
        </div>
      </div>

      {/* Confirmation */}
      <div className="bg-muted flex items-center space-x-2 rounded-lg p-4">
        <Checkbox
          id="confirm"
          checked={isConfirmed}
          onCheckedChange={(checked) => setIsConfirmed(!!checked)}
        />
        <Label htmlFor="confirm" className="cursor-pointer text-sm">
          I confirm this summary accurately reflects the assessment findings
        </Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 border-t pt-4">
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={isSaving}
        >
          Save Draft
        </Button>
        <Button
          onClick={() => handleSave(true)}
          disabled={!isConfirmed || isSaving}
        >
          <Check className="mr-2 h-4 w-4" />
          Complete & Continue
        </Button>
      </div>
    </div>
  )
}
