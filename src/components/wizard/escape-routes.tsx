'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, Route } from 'lucide-react'
import type { SectionData, EscapeRoutesData } from '@/types'

interface EscapeRoutesSectionProps {
  assessmentId: string
  data: SectionData
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

const CHECKLIST_ITEMS = [
  { id: 'routes_clear', label: 'Escape routes are clear of obstructions' },
  { id: 'routes_adequately_lit', label: 'Escape routes are adequately lit' },
  {
    id: 'emergency_lighting_tested',
    label: 'Emergency lighting has been tested and is functional',
  },
  {
    id: 'exit_signs_visible',
    label: 'Exit signs are visible and illuminated where required',
  },
  {
    id: 'assembly_point_identified',
    label: 'Assembly point is identified and communicated to all workers',
  },
  {
    id: 'routes_sufficient_width',
    label: 'Escape routes have sufficient width for evacuation',
  },
]

export function EscapeRoutesSection({
  data: initialData,
  onSave,
  onNext,
  isHighRise,
  isSaving,
}: EscapeRoutesSectionProps) {
  const defaultData: EscapeRoutesData = {
    routes_clear: false,
    routes_adequately_lit: false,
    emergency_lighting_tested: false,
    exit_signs_visible: false,
    assembly_point_identified: false,
    routes_sufficient_width: false,
  }
  const [data, setData] = useState<EscapeRoutesData>({
    ...defaultData,
    ...(initialData as EscapeRoutesData),
  })

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const updateData = (updates: Partial<EscapeRoutesData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const allChecked = CHECKLIST_ITEMS.every(
    (item) => data[item.id as keyof EscapeRoutesData],
  )

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Route className="h-5 w-5" />
          Section 4: Escape Routes
        </h2>
        <p className="text-muted-foreground">
          Assess means of escape and emergency egress
        </p>
      </div>

      {isHighRise && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            <strong>High-Rise Requirements:</strong> Buildings over 18m require
            enhanced evacuation provisions. From 2026, buildings over 18m must
            have a second staircase. Ensure current evacuation strategy is
            documented and communicated.
          </p>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-4">
        <h3 className="font-medium">Escape Routes Checklist</h3>

        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 rounded-lg border p-3"
            >
              <Checkbox
                id={item.id}
                checked={!!data[item.id as keyof EscapeRoutesData]}
                onCheckedChange={(checked) =>
                  updateData({
                    [item.id]: !!checked,
                  } as Partial<EscapeRoutesData>)
                }
              />
              <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={data.notes || ''}
          onChange={(e) => updateData({ notes: e.target.value })}
          placeholder="Document escape route arrangements, any temporary measures, or issues observed..."
          rows={4}
        />
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
          disabled={!allChecked || isSaving}
        >
          <Check className="mr-2 h-4 w-4" />
          Complete & Continue
        </Button>
      </div>
    </div>
  )
}
