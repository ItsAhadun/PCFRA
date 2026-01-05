'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  ClipboardCheck,
  Plus,
  AlertCircle,
} from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useSites } from '@/hooks/use-sites'
import { useCreateAssessment } from '@/hooks/use-assessments'
import { HIGH_RISE_THRESHOLD_M } from '@/types'

function NewAssessmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSiteId = searchParams.get('site')

  const { data: sites, isLoading: sitesLoading } = useSites()
  const createAssessment = useCreateAssessment()

  const [siteId, setSiteId] = useState(preselectedSiteId || '')
  const [assessorName, setAssessorName] = useState('')
  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [error, setError] = useState<string | null>(null)

  const selectedSite = sites?.find((s) => s.id === siteId)
  const isHighRise =
    (selectedSite?.building_height_m || 0) > HIGH_RISE_THRESHOLD_M

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!siteId) {
      setError('Please select a site')
      return
    }

    try {
      const assessment = await createAssessment.mutateAsync({
        site_id: siteId,
        assessor_name: assessorName,
        assessment_date: assessmentDate,
        is_high_rise: isHighRise,
      })

      router.push(`/assessments/${assessment.id}/edit`)
    } catch (err: any) {
      console.error('Failed to create assessment:', err)
      setError(err.message || 'Failed to create assessment. Please try again.')
    }
  }

  const handleSiteChange = (value: string) => {
    if (value === 'new_site') {
      router.push('/sites/new')
      return
    }
    setSiteId(value)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/assessments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Fire Risk Assessment</h1>
          <p className="text-muted-foreground">
            Select a site to begin the assessment
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Site
            </CardTitle>
            <CardDescription>
              Choose the construction site to assess
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site">Site *</Label>
              <Select value={siteId} onValueChange={handleSiteChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sitesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading sites...
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem
                        value="new_site"
                        className="text-primary mb-1 border-b pb-1 font-medium"
                      >
                        <div className="text-primary flex items-center gap-2 font-semibold">
                          <Plus className="h-4 w-4" />
                          Create New Site
                        </div>
                      </SelectItem>

                      {sites?.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No sites available
                        </SelectItem>
                      ) : (
                        sites?.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            <div className="flex items-center gap-2">
                              {site.name}
                              {(site.building_height_m || 0) >
                                HIGH_RISE_THRESHOLD_M && (
                                <span className="text-xs text-orange-500">
                                  (High-Rise)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              {sites?.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No sites found.{' '}
                  <Link
                    href="/sites/new"
                    className="text-primary hover:underline"
                  >
                    Create a site first
                  </Link>
                </p>
              )}
            </div>

            {selectedSite && (
              <div className="bg-muted space-y-2 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedSite.name}</span>
                  {isHighRise && (
                    <span className="rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-500 dark:bg-orange-900/30">
                      High-Rise Building (18m+)
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {selectedSite.address}
                </p>
                <div className="text-muted-foreground flex gap-4 text-xs">
                  {selectedSite.building_height_m && (
                    <span>Height: {selectedSite.building_height_m}m</span>
                  )}
                  {selectedSite.number_of_floors && (
                    <span>Floors: {selectedSite.number_of_floors}</span>
                  )}
                  {selectedSite.building_use && (
                    <span>Use: {selectedSite.building_use}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Assessment Details
            </CardTitle>
            <CardDescription>Information about this assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assessor">Assessor Name *</Label>
                <Input
                  id="assessor"
                  value={assessorName}
                  onChange={(e) => setAssessorName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Assessment Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High-Rise Warning */}
        {isHighRise && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  High-Rise Building Assessment
                </h3>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                  This building exceeds 18 meters in height. Additional Building
                  Safety Act requirements will apply, including enhanced
                  documentation and specific high-rise fire safety
                  considerations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/assessments">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={!siteId || !assessorName || createAssessment.isPending}
          >
            {createAssessment.isPending ? 'Creating...' : 'Start Assessment'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="bg-muted h-8 animate-pulse rounded" />
          <div className="bg-muted h-64 animate-pulse rounded" />
        </div>
      }
    >
      <NewAssessmentForm />
    </Suspense>
  )
}
