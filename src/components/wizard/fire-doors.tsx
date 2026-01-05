'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, DoorOpen } from 'lucide-react'
import type { SectionData, FireDoorsData } from '@/types'

interface FireDoorsSectionProps {
  assessmentId: string
  data: SectionData
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

const CHECKLIST_ITEMS = [
  {
    id: 'doors_inspected',
    label: 'Fire doors have been inspected during this assessment',
  },
  {
    id: 'self_closing_working',
    label: 'Self-closing mechanisms are functioning correctly',
  },
  {
    id: 'gaps_acceptable',
    label: 'Door gaps are within acceptable limits (3mm sides/top, 8mm bottom)',
  },
  { id: 'signage_present', label: 'Fire door signage is present and visible' },
]

export function FireDoorsSection({
  data: initialData,
  onSave,
  onNext,
  isSaving,
}: FireDoorsSectionProps) {
  const defaultData: FireDoorsData = {
    doors_inspected: false,
    doors_condition: 'good',
    self_closing_working: false,
    gaps_acceptable: false,
    signage_present: false,
  }
  const [data, setData] = useState<FireDoorsData>({
    ...defaultData,
    ...(initialData as FireDoorsData),
  })

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const updateData = (updates: Partial<FireDoorsData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const handleChecklistChange = (id: string, checked: boolean) => {
    updateData({ [id]: checked } as Partial<FireDoorsData>)
  }

  const allChecked = CHECKLIST_ITEMS.every(
    (item) => data[item.id as keyof FireDoorsData],
  )

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <DoorOpen className="h-5 w-5" />
          Section 2: Fire Doors
        </h2>
        <p className="text-muted-foreground">
          Assess the condition and compliance of fire doors on site
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        <h3 className="font-medium">Fire Door Checklist</h3>

        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 rounded-lg border p-3"
            >
              <Checkbox
                id={item.id}
                checked={!!data[item.id as keyof FireDoorsData]}
                onCheckedChange={(checked) =>
                  handleChecklistChange(item.id, !!checked)
                }
              />
              <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Condition Assessment */}
      <div className="space-y-4">
        <h3 className="font-medium">Overall Condition</h3>

        <div className="space-y-2">
          <Label htmlFor="condition">Fire Door Condition</Label>
          <Select
            value={data.doors_condition}
            onValueChange={(value) =>
              updateData({ doors_condition: value as 'good' | 'fair' | 'poor' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="good">Good - No issues identified</SelectItem>
              <SelectItem value="fair">
                Fair - Minor issues, non-critical
              </SelectItem>
              <SelectItem value="poor">
                Poor - Significant issues requiring attention
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.doors_condition === 'poor' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ Poor condition fire doors require immediate attention. Ensure
              defects are documented in the Hazards section and actions are
              assigned.
            </p>
          </div>
        )}
      </div>

      {/* Defects */}
      <div className="space-y-2">
        <Label htmlFor="defects">Defects Noted</Label>
        <Textarea
          id="defects"
          value={data.defects_noted || ''}
          onChange={(e) => updateData({ defects_noted: e.target.value })}
          placeholder="Document any defects or issues observed with fire doors..."
          rows={4}
        />
        <p className="text-muted-foreground text-xs">
          Include door locations, types of defects, and any immediate actions
          taken
        </p>
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
