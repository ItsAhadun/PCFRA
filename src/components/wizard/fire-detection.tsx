'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { Check, Bell } from 'lucide-react'
import type { SectionData, FireDetectionData } from '@/types'

interface FireDetectionSectionProps {
  assessmentId: string
  data: SectionData
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

const CHECKLIST_ITEMS = [
  {
    id: 'call_points_accessible',
    label: 'Manual call points are accessible and unobstructed',
  },
  {
    id: 'detectors_appropriate',
    label: 'Detector types are appropriate for the construction environment',
  },
  { id: 'alarm_audible', label: 'Fire alarm is audible in all occupied areas' },
  {
    id: 'maintenance_contract',
    label: 'Maintenance contract is in place and current',
  },
]

export function FireDetectionSection({
  data: initialData,
  onSave,
  onNext,
  isSaving,
}: FireDetectionSectionProps) {
  const defaultData: FireDetectionData = {
    system_type: undefined,
    last_test_date: undefined,
    call_points_accessible: false,
    detectors_appropriate: false,
    alarm_audible: false,
    maintenance_contract: false,
  }
  const [data, setData] = useState<FireDetectionData>({
    ...defaultData,
    ...(initialData as FireDetectionData),
  })

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const updateData = (updates: Partial<FireDetectionData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const allChecked = CHECKLIST_ITEMS.every(
    (item) => data[item.id as keyof FireDetectionData],
  )

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Bell className="h-5 w-5" />
          Section 5: Fire Detection Systems
        </h2>
        <p className="text-muted-foreground">
          Assess fire detection and alarm systems
        </p>
      </div>

      {/* System Details */}
      <div className="space-y-4">
        <h3 className="font-medium">System Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="system_type">System Type</Label>
            <Select
              value={data.system_type || ''}
              onValueChange={(value) =>
                updateData({
                  system_type: value as 'manual' | 'automatic' | 'combined',
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  Manual (Call Points Only)
                </SelectItem>
                <SelectItem value="automatic">Automatic (Detectors)</SelectItem>
                <SelectItem value="combined">
                  Combined (Manual + Automatic)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_test_date">Last Test Date</Label>
            <Input
              id="last_test_date"
              type="date"
              value={data.last_test_date || ''}
              onChange={(e) => updateData({ last_test_date: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        <h3 className="font-medium">Detection System Checklist</h3>

        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 rounded-lg border p-3"
            >
              <Checkbox
                id={item.id}
                checked={!!data[item.id as keyof FireDetectionData]}
                onCheckedChange={(checked) =>
                  updateData({
                    [item.id]: !!checked,
                  } as Partial<FireDetectionData>)
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
          placeholder="Document detector locations, any false alarms issues, or maintenance observations..."
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
