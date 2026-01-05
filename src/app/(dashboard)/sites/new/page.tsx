'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateSite } from '@/hooks/use-sites'
import type { CreateSiteInput } from '@/types'
import { HIGH_RISE_THRESHOLD_M } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const BUILDING_USES = [
  'Residential',
  'Commercial',
  'Mixed Use',
  'Industrial',
  'Healthcare',
  'Education',
  'Retail',
  'Other',
]

const CONSTRUCTION_PHASES = [
  'Pre-construction',
  'Foundation',
  'Structure',
  'Envelope',
  'Interior Fit-out',
  'Commissioning',
  'Handover',
]

export default function NewSitePage() {
  const router = useRouter()
  const createSite = useCreateSite()

  const [form, setForm] = useState<CreateSiteInput>({
    name: '',
    address: '',
    postcode: '',
    building_height_m: undefined,
    number_of_floors: undefined,
    building_use: '',
    construction_phase: '',
    dutyholder_name: '',
    dutyholder_email: '',
    dutyholder_phone: '',
    principal_contractor: '',
  })
  const [error, setError] = useState<string | null>(null)

  const isHighRise = (form.building_height_m || 0) > HIGH_RISE_THRESHOLD_M

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const site = await createSite.mutateAsync(form)
      router.push('/sites')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site')
    }
  }

  const updateForm = (updates: Partial<CreateSiteInput>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sites">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Site</h1>
          <p className="text-muted-foreground">
            Enter the details of the construction site
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Site Information
            </CardTitle>
            <CardDescription>
              Basic details about the construction site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Site Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                placeholder="e.g., Tower Block A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => updateForm({ address: e.target.value })}
                placeholder="Full site address"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={form.postcode || ''}
                  onChange={(e) => updateForm({ postcode: e.target.value })}
                  placeholder="e.g., SW1A 1AA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="principal_contractor">
                  Principal Contractor
                </Label>
                <Input
                  id="principal_contractor"
                  value={form.principal_contractor || ''}
                  onChange={(e) =>
                    updateForm({ principal_contractor: e.target.value })
                  }
                  placeholder="Contractor name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Building Details */}
        <Card>
          <CardHeader>
            <CardTitle>Building Details</CardTitle>
            <CardDescription>
              Physical characteristics of the building
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="height">Building Height (m)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.building_height_m || ''}
                  onChange={(e) =>
                    updateForm({
                      building_height_m: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 25.5"
                />
                {isHighRise && (
                  <p className="text-xs font-medium text-orange-600">
                    ⚠️ High-rise building - additional requirements apply
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="floors">Number of Floors</Label>
                <Input
                  id="floors"
                  type="number"
                  min="1"
                  value={form.number_of_floors || ''}
                  onChange={(e) =>
                    updateForm({
                      number_of_floors: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="building_use">Building Use</Label>
                <Select
                  value={form.building_use || ''}
                  onValueChange={(value) => updateForm({ building_use: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select use" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_USES.map((use) => (
                      <SelectItem key={use} value={use}>
                        {use}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phase">Construction Phase</Label>
                <Select
                  value={form.construction_phase || ''}
                  onValueChange={(value) =>
                    updateForm({ construction_phase: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSTRUCTION_PHASES.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dutyholder Information */}
        <Card>
          <CardHeader>
            <CardTitle>Dutyholder Information</CardTitle>
            <CardDescription>
              Contact details for the responsible person
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dutyholder_name">Dutyholder Name</Label>
              <Input
                id="dutyholder_name"
                value={form.dutyholder_name || ''}
                onChange={(e) =>
                  updateForm({ dutyholder_name: e.target.value })
                }
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dutyholder_email">Email</Label>
                <Input
                  id="dutyholder_email"
                  type="email"
                  value={form.dutyholder_email || ''}
                  onChange={(e) =>
                    updateForm({ dutyholder_email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dutyholder_phone">Phone</Label>
                <Input
                  id="dutyholder_phone"
                  type="tel"
                  value={form.dutyholder_phone || ''}
                  onChange={(e) =>
                    updateForm({ dutyholder_phone: e.target.value })
                  }
                  placeholder="+44 ..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/sites">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createSite.isPending}>
            {createSite.isPending ? 'Creating...' : 'Create Site'}
          </Button>
        </div>
      </form>
    </div>
  )
}
