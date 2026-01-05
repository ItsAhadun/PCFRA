'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, PenLine, FileCheck, AlertTriangle } from 'lucide-react'
import { SignatureCanvas } from '@/components/assessment/signature-canvas'
import { useSignOffAssessment } from '@/hooks/use-assessments'
import { useCriticalHazardsCount } from '@/hooks/use-hazards'
import type { SectionData, SignOffData, Assessment } from '@/types'

interface SignOffSectionProps {
  assessmentId: string
  data: SectionData
  assessment?: Assessment
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

export function SignOffSection({
  assessmentId,
  data: initialData,
  assessment,
  onSave,
  isHighRise,
  isSaving,
}: SignOffSectionProps) {
  const router = useRouter()
  const signOff = useSignOffAssessment()
  const { data: criticalCount = 0 } = useCriticalHazardsCount(assessmentId)

  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [nextReviewDate, setNextReviewDate] = useState(
    () =>
      assessment?.next_review_date ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
  )

  const defaultChecks: SignOffData = {
    assessor_declaration: false,
    dutyholder_notified: false,
    review_date_set: false,
  }
  const [checks, setChecks] = useState<SignOffData>({
    ...defaultChecks,
    ...(initialData as SignOffData),
  })

  const hasCriticalUnresolved = criticalCount > 0
  const allChecked =
    checks.assessor_declaration &&
    checks.dutyholder_notified &&
    checks.review_date_set
  const canSignOff = allChecked && signatureData && !hasCriticalUnresolved

  const handleSignatureChange = (data: string) => {
    setSignatureData(data)
  }

  const handleSignOff = async () => {
    if (!canSignOff) return

    await signOff.mutateAsync({
      id: assessmentId,
      signatureData: signatureData!,
      nextReviewDate,
    })

    onSave(checks, true)
    router.push(`/assessments/${assessmentId}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <PenLine className="h-5 w-5" />
          Section 10: Sign Off
        </h2>
        <p className="text-muted-foreground">
          Complete the assessment with your digital signature
        </p>
      </div>

      {/* Critical hazard warning */}
      {hasCriticalUnresolved && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Cannot Sign Off - {criticalCount} Critical Hazard
              {criticalCount > 1 ? 's' : ''} Unresolved
            </p>
          </div>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            All critical hazards (risk score ≥15) must have assigned actions and
            be marked as resolved before the assessment can be signed off.
            Please return to Sections 7 & 8.
          </p>
        </div>
      )}

      {/* Assessment Summary */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <h3 className="mb-3 font-medium">Assessment Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Assessment Number:</span>
            <p className="font-medium">{assessment?.assessment_number}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Site:</span>
            <p className="font-medium">{assessment?.site?.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Assessor:</span>
            <p className="font-medium">{assessment?.assessor_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Date:</span>
            <p className="font-medium">
              {assessment?.assessment_date &&
                new Date(assessment.assessment_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* High-Rise Notice */}
      {isHighRise && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            <strong>High-Rise Building:</strong> This assessment will be
            included in the Golden Thread documentation as required by the
            Building Safety Act 2022.
          </p>
        </div>
      )}

      {/* Declarations */}
      <div className="space-y-4">
        <h3 className="font-medium">Declarations</h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-3 rounded-lg border p-3">
            <Checkbox
              id="assessor_declaration"
              checked={checks.assessor_declaration}
              onCheckedChange={(checked) =>
                setChecks((prev) => ({
                  ...prev,
                  assessor_declaration: !!checked,
                }))
              }
            />
            <Label
              htmlFor="assessor_declaration"
              className="cursor-pointer text-sm"
            >
              I declare that this fire risk assessment has been conducted in
              accordance with the Regulatory Reform (Fire Safety) Order 2005 and
              represents my professional opinion of the fire risks at this site
              on the date of assessment.
            </Label>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border p-3">
            <Checkbox
              id="dutyholder_notified"
              checked={checks.dutyholder_notified}
              onCheckedChange={(checked) =>
                setChecks((prev) => ({
                  ...prev,
                  dutyholder_notified: !!checked,
                }))
              }
            />
            <Label
              htmlFor="dutyholder_notified"
              className="cursor-pointer text-sm"
            >
              The Dutyholder has been notified of the findings and a copy of
              this assessment will be provided to them.
            </Label>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border p-3">
            <Checkbox
              id="review_date_set"
              checked={checks.review_date_set}
              onCheckedChange={(checked) =>
                setChecks((prev) => ({ ...prev, review_date_set: !!checked }))
              }
            />
            <Label htmlFor="review_date_set" className="cursor-pointer text-sm">
              A review date has been set and the responsible person has been
              informed of the requirement to review this assessment at least
              annually or when changes occur.
            </Label>
          </div>
        </div>
      </div>

      {/* Next Review Date */}
      <div className="space-y-2">
        <Label htmlFor="review_date">Next Review Date</Label>
        <Input
          id="review_date"
          type="date"
          value={nextReviewDate}
          onChange={(e) => setNextReviewDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="text-muted-foreground text-xs">
          Fire risk assessments should be reviewed at least annually, or sooner
          if significant changes occur to the building or its use.
        </p>
      </div>

      {/* Signature */}
      <div className="space-y-3">
        <Label>Digital Signature</Label>
        <SignatureCanvas
          onSave={handleSignatureChange}
          onClear={() => setSignatureData(null)}
          initialValue={signatureData || undefined}
        />
      </div>

      {/* Sign Off Button */}
      <div className="flex justify-end gap-4 border-t pt-6">
        <Button
          variant="outline"
          onClick={() => onSave(checks, false)}
          disabled={isSaving}
        >
          Save Draft
        </Button>
        <Button
          size="lg"
          onClick={handleSignOff}
          disabled={!canSignOff || signOff.isPending || isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          <FileCheck className="mr-2 h-5 w-5" />
          {signOff.isPending ? 'Signing Off...' : 'Sign Off Assessment'}
        </Button>
      </div>

      {!canSignOff && !hasCriticalUnresolved && (
        <p className="text-muted-foreground text-center text-sm">
          Complete all declarations and provide your signature to sign off
        </p>
      )}
    </div>
  )
}
