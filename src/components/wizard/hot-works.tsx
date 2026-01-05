'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, Flame } from 'lucide-react'
import type { SectionData, HotWorksData } from '@/types'

interface HotWorksSectionProps {
  assessmentId: string
  data: SectionData
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

const CHECKLIST_ITEMS = [
  {
    id: 'permit_system_in_place',
    label: 'Hot works permit system is in place and being used',
  },
  {
    id: 'fire_watch_procedures',
    label: 'Fire watch procedures are documented and followed',
  },
  {
    id: 'extinguishers_available',
    label: 'Fire extinguishers are available at hot works locations',
  },
  {
    id: 'combustibles_cleared',
    label: 'Combustible materials cleared from hot works area (minimum 10m)',
  },
]

export function HotWorksSection({
  data: initialData,
  onSave,
  onNext,
  isSaving,
}: HotWorksSectionProps) {
  const defaultData: HotWorksData = {
    hot_works_present: false,
    permit_system_in_place: false,
    fire_watch_procedures: false,
    extinguishers_available: false,
    combustibles_cleared: false,
  }
  const [data, setData] = useState<HotWorksData>({
    ...defaultData,
    ...(initialData as HotWorksData),
  })

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const updateData = (updates: Partial<HotWorksData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const allRequiredChecked =
    !data.hot_works_present ||
    CHECKLIST_ITEMS.every((item) => data[item.id as keyof HotWorksData])

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Flame className="h-5 w-5" />
          Section 3: Hot Works Management
        </h2>
        <p className="text-muted-foreground">
          Assess hot works activities and permit controls
        </p>
      </div>

      {/* Hot works present */}
      <div className="bg-muted/50 flex items-center space-x-3 rounded-lg border p-4">
        <Checkbox
          id="hot_works_present"
          checked={data.hot_works_present}
          onCheckedChange={(checked) =>
            updateData({ hot_works_present: !!checked })
          }
        />
        <Label
          htmlFor="hot_works_present"
          className="flex-1 cursor-pointer font-medium"
        >
          Hot works activities are currently being undertaken on site
        </Label>
      </div>

      {data.hot_works_present ? (
        <>
          {/* Checklist */}
          <div className="space-y-4">
            <h3 className="font-medium">Hot Works Controls Checklist</h3>

            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 rounded-lg border p-3"
                >
                  <Checkbox
                    id={item.id}
                    checked={!!data[item.id as keyof HotWorksData]}
                    onCheckedChange={(checked) =>
                      updateData({
                        [item.id]: !!checked,
                      } as Partial<HotWorksData>)
                    }
                  />
                  <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Warning if not all checked */}
          {!allRequiredChecked && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠️ All hot works controls must be in place before operations can
                continue. Missing controls should be documented as hazards with
                immediate actions.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => updateData({ notes: e.target.value })}
              placeholder="Document hot works locations, types of work, and any observations..."
              rows={4}
            />
          </div>
        </>
      ) : (
        <div className="rounded-lg border-2 border-dashed p-6 text-center">
          <Flame className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground">
            No hot works activities currently on site.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            If hot works commence, update this section accordingly.
          </p>
        </div>
      )}

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
          disabled={!allRequiredChecked || isSaving}
        >
          <Check className="mr-2 h-4 w-4" />
          Complete & Continue
        </Button>
      </div>
    </div>
  )
}
