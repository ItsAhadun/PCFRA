'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreateTenantInput, UpdateTenantInput, Tenant, Site } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, ArrowLeft, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QR_RISK_CLASSES } from '@/utils/qr-generator'
import { calculateTenantRiskLevel } from '@/utils/tenant-risk'

interface TenantFormProps {
  tenant?: Tenant
  sites: Site[]
  selectedSiteId?: string
  onSubmit: (data: CreateTenantInput | UpdateTenantInput) => Promise<void>
  isSubmitting?: boolean
}

export function TenantForm({
  tenant,
  sites,
  selectedSiteId,
  onSubmit,
  isSubmitting = false,
}: TenantFormProps) {
  const router = useRouter()
  const isEditing = !!tenant

  const [formData, setFormData] = useState<Partial<CreateTenantInput>>({
    site_id: tenant?.site_id || selectedSiteId || '',
    apartment_number: tenant?.apartment_number || '',
    floor_number: tenant?.floor_number || 1,
    tenant_name: tenant?.tenant_name || '',
    has_mobility_issues: tenant?.has_mobility_issues || false,
    uses_wheelchair: tenant?.uses_wheelchair || false,
    has_visual_impairment: tenant?.has_visual_impairment || false,
    has_hearing_impairment: tenant?.has_hearing_impairment || false,
    has_cognitive_impairment: tenant?.has_cognitive_impairment || false,
    requires_assistance_evacuation:
      tenant?.requires_assistance_evacuation || false,
    other_disabilities: tenant?.other_disabilities || '',
    blood_type: tenant?.blood_type || '',
    allergies: tenant?.allergies || '',
    medical_conditions: tenant?.medical_conditions || '',
    oxygen_dependent: tenant?.oxygen_dependent || false,
    emergency_contact_name: tenant?.emergency_contact_name || '',
    emergency_contact_phone: tenant?.emergency_contact_phone || '',
    notes: tenant?.notes || '',
    number_of_occupants: tenant?.number_of_occupants || 1,
  })

  const [error, setError] = useState<string | null>(null)

  // Calculate estimated risk level
  const estimatedRisk = calculateTenantRiskLevel({
    uses_wheelchair: formData.uses_wheelchair || false,
    has_mobility_issues: formData.has_mobility_issues || false,
    requires_assistance_evacuation:
      formData.requires_assistance_evacuation || false,
    oxygen_dependent: formData.oxygen_dependent || false,
    has_visual_impairment: formData.has_visual_impairment || false,
    has_hearing_impairment: formData.has_hearing_impairment || false,
    has_cognitive_impairment: formData.has_cognitive_impairment || false,
    floor_number: formData.floor_number || 1,
  })

  const riskClasses = QR_RISK_CLASSES[estimatedRisk]

  const updateField = <K extends keyof CreateTenantInput>(
    field: K,
    value: CreateTenantInput[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.site_id) {
      setError('Please select a site')
      return
    }
    if (!formData.apartment_number) {
      setError('Apartment number is required')
      return
    }
    if (!formData.tenant_name) {
      setError('Tenant name is required')
      return
    }

    try {
      if (isEditing && tenant) {
        await onSubmit({ id: tenant.id, ...formData } as UpdateTenantInput)
      } else {
        await onSubmit(formData as CreateTenantInput)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the tenant&apos;s apartment and personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Site Selection */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="site_id">Building / Site *</Label>
            <Select
              value={formData.site_id}
              onValueChange={(value) => updateField('site_id', value)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a building" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name} - {site.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Apartment Number */}
          <div className="space-y-2">
            <Label htmlFor="apartment_number">Apartment Number *</Label>
            <Input
              id="apartment_number"
              value={formData.apartment_number}
              onChange={(e) => updateField('apartment_number', e.target.value)}
              placeholder="e.g., 5A, 12B, 301"
            />
          </div>

          {/* Floor Number */}
          <div className="space-y-2">
            <Label htmlFor="floor_number">Floor Number *</Label>
            <Input
              id="floor_number"
              type="number"
              min={0}
              value={formData.floor_number}
              onChange={(e) =>
                updateField('floor_number', parseInt(e.target.value) || 1)
              }
            />
          </div>

          {/* Tenant Name */}
          <div className="space-y-2">
            <Label htmlFor="tenant_name">Tenant Name *</Label>
            <Input
              id="tenant_name"
              value={formData.tenant_name}
              onChange={(e) => updateField('tenant_name', e.target.value)}
              placeholder="Full name"
            />
          </div>

          {/* Number of Occupants */}
          <div className="space-y-2">
            <Label htmlFor="number_of_occupants">Number of Occupants</Label>
            <Input
              id="number_of_occupants"
              type="number"
              min={1}
              value={formData.number_of_occupants}
              onChange={(e) =>
                updateField(
                  'number_of_occupants',
                  parseInt(e.target.value) || 1,
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobility & Disability Information */}
      <Card>
        <CardHeader>
          <CardTitle>Mobility & Disability Information</CardTitle>
          <CardDescription>
            This information helps emergency responders prioritize assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Wheelchair */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="uses_wheelchair"
                checked={formData.uses_wheelchair}
                onCheckedChange={(checked) =>
                  updateField('uses_wheelchair', !!checked)
                }
              />
              <Label htmlFor="uses_wheelchair" className="cursor-pointer">
                Uses Wheelchair
              </Label>
            </div>

            {/* Mobility Issues */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_mobility_issues"
                checked={formData.has_mobility_issues}
                onCheckedChange={(checked) =>
                  updateField('has_mobility_issues', !!checked)
                }
              />
              <Label htmlFor="has_mobility_issues" className="cursor-pointer">
                Has Mobility Issues
              </Label>
            </div>

            {/* Requires Evacuation Assistance */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_assistance_evacuation"
                checked={formData.requires_assistance_evacuation}
                onCheckedChange={(checked) =>
                  updateField('requires_assistance_evacuation', !!checked)
                }
              />
              <Label
                htmlFor="requires_assistance_evacuation"
                className="cursor-pointer"
              >
                Requires Evacuation Assistance
              </Label>
            </div>

            {/* Oxygen Dependent */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="oxygen_dependent"
                checked={formData.oxygen_dependent}
                onCheckedChange={(checked) =>
                  updateField('oxygen_dependent', !!checked)
                }
              />
              <Label htmlFor="oxygen_dependent" className="cursor-pointer">
                Oxygen Dependent
              </Label>
            </div>

            {/* Visual Impairment */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_visual_impairment"
                checked={formData.has_visual_impairment}
                onCheckedChange={(checked) =>
                  updateField('has_visual_impairment', !!checked)
                }
              />
              <Label htmlFor="has_visual_impairment" className="cursor-pointer">
                Visual Impairment
              </Label>
            </div>

            {/* Hearing Impairment */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_hearing_impairment"
                checked={formData.has_hearing_impairment}
                onCheckedChange={(checked) =>
                  updateField('has_hearing_impairment', !!checked)
                }
              />
              <Label
                htmlFor="has_hearing_impairment"
                className="cursor-pointer"
              >
                Hearing Impairment
              </Label>
            </div>

            {/* Cognitive Impairment */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_cognitive_impairment"
                checked={formData.has_cognitive_impairment}
                onCheckedChange={(checked) =>
                  updateField('has_cognitive_impairment', !!checked)
                }
              />
              <Label
                htmlFor="has_cognitive_impairment"
                className="cursor-pointer"
              >
                Cognitive Impairment
              </Label>
            </div>
          </div>

          {/* Other Disabilities */}
          <div className="space-y-2">
            <Label htmlFor="other_disabilities">
              Other Disabilities / Conditions
            </Label>
            <Textarea
              id="other_disabilities"
              value={formData.other_disabilities}
              onChange={(e) =>
                updateField('other_disabilities', e.target.value)
              }
              placeholder="Describe any other disabilities or conditions not listed above..."
              rows={2}
            />
          </div>

          {/* Risk Level Preview */}
          <div
            className={cn(
              'mt-4 flex items-center gap-3 rounded-lg border-2 p-4',
              riskClasses.border,
              riskClasses.bg,
            )}
          >
            <AlertTriangle className={cn('h-5 w-5', riskClasses.text)} />
            <div>
              <p className={cn('font-medium', riskClasses.text)}>
                Estimated Risk Level: {estimatedRisk.toUpperCase()}
              </p>
              <p className="text-muted-foreground text-sm">
                Based on selected conditions and floor number
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
          <CardDescription>
            Optional medical details that may be relevant in an emergency
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Blood Type */}
          <div className="space-y-2">
            <Label htmlFor="blood_type">Blood Type</Label>
            <Select
              value={formData.blood_type || ''}
              onValueChange={(value) => updateField('blood_type', value)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Allergies */}
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => updateField('allergies', e.target.value)}
              placeholder="e.g., Penicillin, Bee stings, Peanuts"
              rows={2}
            />
          </div>

          {/* Medical Conditions */}
          <div className="space-y-2">
            <Label htmlFor="medical_conditions">Medical Conditions</Label>
            <Textarea
              id="medical_conditions"
              value={formData.medical_conditions}
              onChange={(e) =>
                updateField('medical_conditions', e.target.value)
              }
              placeholder="e.g., Diabetes, Heart condition, Epilepsy"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Contact person in case of emergency</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Contact Name</Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) =>
                updateField('emergency_contact_name', e.target.value)
              }
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={(e) =>
                updateField('emergency_contact_phone', e.target.value)
              }
              placeholder="+44 7XXX XXXXXX"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Any other relevant information..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEditing ? 'Update Tenant' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  )
}
