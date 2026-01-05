'use client'

import { useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Check, Plus, Camera, AlertTriangle } from 'lucide-react'
import {
  useHazards,
  useCreateHazard,
  useDeleteHazard,
  useUploadHazardPhoto,
} from '@/hooks/use-hazards'
import { HazardCard } from '@/components/assessment/hazard-card'
import { RiskMatrix, RiskBadge } from '@/components/assessment/risk-matrix'
import { calculateRisk } from '@/utils/risk-calculator'
import type {
  SectionData,
  CreateHazardInput,
  RiskScore,
  HazardType,
} from '@/types'
import { HAZARD_TYPES } from '@/types'

interface HazardsSectionProps {
  assessmentId: string
  data: SectionData
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

export function HazardsSection({
  assessmentId,
  data,
  onSave,
  onNext,
  isSaving,
}: HazardsSectionProps) {
  const { data: hazards = [], isLoading } = useHazards(assessmentId)
  const createHazard = useCreateHazard()
  const deleteHazard = useDeleteHazard()
  const uploadPhoto = useUploadHazardPhoto()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [newHazard, setNewHazard] = useState<Partial<CreateHazardInput>>({
    severity: 3,
    likelihood: 3,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingHazardId, setUploadingHazardId] = useState<string | null>(
    null,
  )

  const criticalHazards = hazards.filter(
    (h) => h.risk_level === 'critical' && !h.is_resolved,
  )
  const hasCriticalUnresolved = criticalHazards.length > 0

  const riskPreview =
    newHazard.severity && newHazard.likelihood
      ? calculateRisk(
          newHazard.severity as RiskScore,
          newHazard.likelihood as RiskScore,
        )
      : null

  const handleCreateHazard = async () => {
    if (
      !newHazard.location ||
      !newHazard.description ||
      !newHazard.severity ||
      !newHazard.likelihood
    ) {
      return
    }

    await createHazard.mutateAsync({
      assessment_id: assessmentId,
      location: newHazard.location,
      description: newHazard.description,
      hazard_type: newHazard.hazard_type,
      severity: newHazard.severity as RiskScore,
      likelihood: newHazard.likelihood as RiskScore,
      control_measures: newHazard.control_measures,
    })

    setNewHazard({ severity: 3, likelihood: 3 })
    setDialogOpen(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingHazardId) return

    await uploadPhoto.mutateAsync({
      hazardId: uploadingHazardId,
      file,
      assessmentId,
    })

    setUploadingHazardId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <AlertTriangle className="h-5 w-5" />
          Section 7: Hazard Identification
        </h2>
        <p className="text-muted-foreground">
          Identify fire hazards and assess their risk using the S × L matrix
        </p>
      </div>

      {/* Critical warning */}
      {hasCriticalUnresolved && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            ⚠️ {criticalHazards.length} Critical Hazard
            {criticalHazards.length > 1 ? 's' : ''} Identified
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Critical risks (score ≥15) require immediate action before work can
            continue safely. Ensure actions are assigned in the next section.
          </p>
        </div>
      )}

      {/* Add Hazard Button */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {hazards.length} hazard{hazards.length !== 1 ? 's' : ''} identified
        </span>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Hazard
        </Button>
      </div>

      {/* Hazards List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : hazards.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <AlertTriangle className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground">No hazards identified yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add hazards you identify during the site inspection
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Hazard
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {hazards.map((hazard) => (
            <HazardCard
              key={hazard.id}
              hazard={hazard}
              onDelete={() =>
                deleteHazard.mutate({ id: hazard.id, assessmentId })
              }
              onAddPhoto={() => {
                setUploadingHazardId(hazard.id)
                fileInputRef.current?.click()
              }}
            />
          ))}
        </div>
      )}

      {/* Risk Matrix */}
      {hazards.length > 0 && <RiskMatrix hazards={hazards} />}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Add Hazard Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Hazard</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={newHazard.location || ''}
                onChange={(e) =>
                  setNewHazard((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="e.g., Floor 3, East Wing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hazard_type">Hazard Type</Label>
              <Select
                value={newHazard.hazard_type || ''}
                onValueChange={(value) =>
                  setNewHazard((prev) => ({
                    ...prev,
                    hazard_type: value as HazardType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(HAZARD_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newHazard.description || ''}
                onChange={(e) =>
                  setNewHazard((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the hazard in detail..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity (1-5) *</Label>
                <Select
                  value={String(newHazard.severity || 3)}
                  onValueChange={(value) =>
                    setNewHazard((prev) => ({
                      ...prev,
                      severity: parseInt(value) as RiskScore,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Negligible</SelectItem>
                    <SelectItem value="2">2 - Slight</SelectItem>
                    <SelectItem value="3">3 - Moderate</SelectItem>
                    <SelectItem value="4">4 - Severe</SelectItem>
                    <SelectItem value="5">5 - Catastrophic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="likelihood">Likelihood (1-5) *</Label>
                <Select
                  value={String(newHazard.likelihood || 3)}
                  onValueChange={(value) =>
                    setNewHazard((prev) => ({
                      ...prev,
                      likelihood: parseInt(value) as RiskScore,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Rare</SelectItem>
                    <SelectItem value="2">2 - Unlikely</SelectItem>
                    <SelectItem value="3">3 - Possible</SelectItem>
                    <SelectItem value="4">4 - Likely</SelectItem>
                    <SelectItem value="5">5 - Almost Certain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Risk Preview */}
            {riskPreview && (
              <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                <span className="text-sm">Calculated Risk:</span>
                <RiskBadge
                  level={riskPreview.level}
                  score={riskPreview.score}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="control_measures">
                Existing Control Measures
              </Label>
              <Textarea
                id="control_measures"
                value={newHazard.control_measures || ''}
                onChange={(e) =>
                  setNewHazard((prev) => ({
                    ...prev,
                    control_measures: e.target.value,
                  }))
                }
                placeholder="Describe any existing controls in place..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateHazard}
              disabled={
                !newHazard.location ||
                !newHazard.description ||
                createHazard.isPending
              }
            >
              {createHazard.isPending ? 'Adding...' : 'Add Hazard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actions */}
      <div className="flex justify-end gap-4 border-t pt-4">
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={isSaving}
        >
          Save Draft
        </Button>
        <Button onClick={() => handleSave(true)} disabled={isSaving}>
          <Check className="mr-2 h-4 w-4" />
          Complete & Continue
        </Button>
      </div>
    </div>
  )
}
