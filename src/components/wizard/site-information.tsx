'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Building2, Check } from 'lucide-react'
import type { Site, SectionData, SiteInformationData } from '@/types'
import { HIGH_RISE_THRESHOLD_M } from '@/types'

interface SiteInformationSectionProps {
  assessmentId: string
  data: SectionData
  site?: Site
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

export function SiteInformationSection({
  data: initialData,
  site,
  onSave,
  onNext,
  isHighRise,
  isSaving,
}: SiteInformationSectionProps) {
  const [data, setData] = useState<SiteInformationData>(
    (initialData as SiteInformationData) || {},
  )
  const [isConfirmed, setIsConfirmed] = useState(false)

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(initialData as SiteInformationData)
    }
  }, [initialData])

  const updateData = (updates: Partial<SiteInformationData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Section 1: Site Information</h2>
        <p className="text-muted-foreground">
          Review and confirm the site details for this assessment
        </p>
      </div>

      {/* Site details from database */}
      {site && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4" />
              {site.name}
            </h3>
            {isHighRise && (
              <span className="flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-500 dark:bg-orange-900/30">
                <AlertTriangle className="h-3 w-3" />
                High-Rise (18m+)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Address:</span>
              <p className="font-medium">{site.address}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Postcode:</span>
              <p className="font-medium">{site.postcode || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Building Height:</span>
              <p className="font-medium">
                {site.building_height_m
                  ? `${site.building_height_m}m`
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Number of Floors:</span>
              <p className="font-medium">
                {site.number_of_floors || 'Not specified'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Building Use:</span>
              <p className="font-medium">
                {site.building_use || 'Not specified'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Construction Phase:</span>
              <p className="font-medium">
                {site.construction_phase || 'Not specified'}
              </p>
            </div>
          </div>

          {site.principal_contractor && (
            <div className="border-t pt-2">
              <span className="text-muted-foreground text-sm">
                Principal Contractor:
              </span>
              <p className="font-medium">{site.principal_contractor}</p>
            </div>
          )}
        </div>
      )}

      {isHighRise && (
        <div className="rounded-lg border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
          <h4 className="flex items-center gap-2 font-medium text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-4 w-4" />
            High-Rise Building Requirements
          </h4>
          <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
            This building exceeds 18 meters in height. The following additional
            requirements from the Building Safety Act 2022 will apply:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-orange-700 dark:text-orange-300">
            <li>Enhanced fire safety documentation (Golden Thread)</li>
            <li>Second staircase requirement (from 2026)</li>
            <li>Regular safety case reviews with Building Safety Regulator</li>
            <li>Detailed evacuation strategy documentation</li>
          </ul>
        </div>
      )}

      {/* Additional information */}
      <div className="space-y-4">
        <h3 className="font-medium">Additional Site Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="site_contact">Site Contact Name</Label>
            <Input
              id="site_contact"
              value={data.site_contact || ''}
              onChange={(e) => updateData({ site_contact: e.target.value })}
              placeholder="Contact person on site"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_contact_phone">Site Contact Phone</Label>
            <Input
              id="site_contact_phone"
              type="tel"
              value={data.site_contact_phone || ''}
              onChange={(e) =>
                updateData({ site_contact_phone: e.target.value })
              }
              placeholder="+44..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="building_description">Building Description</Label>
          <Textarea
            id="building_description"
            value={data.building_description || ''}
            onChange={(e) =>
              updateData({ building_description: e.target.value })
            }
            placeholder="Brief description of the building and its current state"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="occupancy_type">Occupancy Type</Label>
            <Input
              id="occupancy_type"
              value={data.occupancy_type || ''}
              onChange={(e) => updateData({ occupancy_type: e.target.value })}
              placeholder="e.g., Construction workers only"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_occupancy">Maximum Occupancy</Label>
            <Input
              id="max_occupancy"
              type="number"
              value={data.max_occupancy || ''}
              onChange={(e) =>
                updateData({
                  max_occupancy: parseInt(e.target.value) || undefined,
                })
              }
              placeholder="e.g., 150"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="working_hours">Working Hours</Label>
          <Input
            id="working_hours"
            value={data.working_hours || ''}
            onChange={(e) => updateData({ working_hours: e.target.value })}
            placeholder="e.g., Mon-Fri 07:00-18:00"
          />
        </div>

        {isHighRise && (
          <div className="space-y-2">
            <Label htmlFor="high_rise_notes">High-Rise Specific Notes</Label>
            <Textarea
              id="high_rise_notes"
              value={data.high_rise_notes || ''}
              onChange={(e) => updateData({ high_rise_notes: e.target.value })}
              placeholder="Any specific notes regarding high-rise fire safety measures"
              rows={3}
            />
          </div>
        )}
      </div>

      {/* Confirmation */}
      <div className="bg-muted flex items-center space-x-2 rounded-lg p-4">
        <Checkbox
          id="confirm"
          checked={isConfirmed}
          onCheckedChange={(checked) => setIsConfirmed(!!checked)}
        />
        <Label htmlFor="confirm" className="cursor-pointer text-sm">
          I confirm that the site information above is accurate and complete
        </Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
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
