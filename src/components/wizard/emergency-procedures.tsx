'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, FileText } from 'lucide-react'
import type { SectionData, EmergencyProceduresData } from '@/types'

interface EmergencyProceduresSectionProps {
  assessmentId: string
  data: SectionData
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

const CHECKLIST_ITEMS = [
  {
    id: 'evacuation_plan_exists',
    label: 'Written evacuation plan exists for the site',
  },
  {
    id: 'plan_displayed',
    label: 'Evacuation plan is displayed at key locations',
  },
  {
    id: 'fire_marshals_trained',
    label: 'Fire marshals/wardens have been trained and identified',
  },
  { id: 'drills_conducted', label: 'Fire drills have been conducted' },
  {
    id: 'emergency_contacts_posted',
    label: 'Emergency contact numbers are posted',
  },
]

export function EmergencyProceduresSection({
  data: initialData,
  onSave,
  onNext,
  isSaving,
}: EmergencyProceduresSectionProps) {
  const defaultData: EmergencyProceduresData = {
    evacuation_plan_exists: false,
    plan_displayed: false,
    fire_marshals_trained: false,
    drills_conducted: false,
    last_drill_date: undefined,
    emergency_contacts_posted: false,
  }
  const [data, setData] = useState<EmergencyProceduresData>({
    ...defaultData,
    ...(initialData as EmergencyProceduresData),
  })

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const updateData = (updates: Partial<EmergencyProceduresData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const allChecked = CHECKLIST_ITEMS.every(
    (item) => data[item.id as keyof EmergencyProceduresData],
  )

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <FileText className="h-5 w-5" />
          Section 6: Emergency Procedures
        </h2>
        <p className="text-muted-foreground">
          Review emergency procedures and evacuation arrangements
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        <h3 className="font-medium">Emergency Procedures Checklist</h3>

        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 rounded-lg border p-3"
            >
              <Checkbox
                id={item.id}
                checked={!!data[item.id as keyof EmergencyProceduresData]}
                onCheckedChange={(checked) =>
                  updateData({
                    [item.id]: !!checked,
                  } as Partial<EmergencyProceduresData>)
                }
              />
              <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Last drill date - shown if drills checked */}
      {data.drills_conducted && (
        <div className="space-y-2">
          <Label htmlFor="last_drill_date">Date of Last Fire Drill</Label>
          <Input
            id="last_drill_date"
            type="date"
            value={data.last_drill_date || ''}
            onChange={(e) => updateData({ last_drill_date: e.target.value })}
          />
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={data.notes || ''}
          onChange={(e) => updateData({ notes: e.target.value })}
          placeholder="Document emergency procedure details, drill observations, or areas for improvement..."
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
