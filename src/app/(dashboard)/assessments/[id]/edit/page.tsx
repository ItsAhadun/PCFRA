'use client'

import { use } from 'react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useAssessment,
  useSaveSection,
  useUpdateAssessmentStatus,
} from '@/hooks/use-assessments'
import {
  WizardNavigation,
  WizardStepIndicator,
} from '@/components/assessment/wizard-navigation'
import type { SectionNumber, SectionData } from '@/types'

// Wizard section components
import { SiteInformationSection } from '@/components/wizard/site-information'
import { FireDoorsSection } from '@/components/wizard/fire-doors'
import { HotWorksSection } from '@/components/wizard/hot-works'
import { EscapeRoutesSection } from '@/components/wizard/escape-routes'
import { FireDetectionSection } from '@/components/wizard/fire-detection'
import { EmergencyProceduresSection } from '@/components/wizard/emergency-procedures'
import { HazardsSection } from '@/components/wizard/hazards'
import { ActionsSection } from '@/components/wizard/actions'
import { SummarySection } from '@/components/wizard/summary'
import { SignOffSection } from '@/components/wizard/sign-off'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditAssessmentPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const { data: assessment, isLoading, error } = useAssessment(id)
  const saveSection = useSaveSection()
  const updateStatus = useUpdateAssessmentStatus()

  const [currentSection, setCurrentSection] = useState<SectionNumber>(1)
  const [isSaving, setIsSaving] = useState(false)

  const completedSections =
    assessment?.sections
      ?.filter((s) => s.is_completed)
      .map((s) => s.section_number as SectionNumber) || []

  const isHighRise = assessment?.is_high_rise || false

  const handleSectionSave = useCallback(
    async (
      sectionNumber: SectionNumber,
      data: SectionData,
      isCompleted: boolean = false,
    ) => {
      if (!assessment?.id) return

      setIsSaving(true)
      try {
        await saveSection.mutateAsync({
          assessmentId: assessment.id,
          sectionNumber,
          data,
          isCompleted,
        })

        // Update assessment status if moving forward
        if (sectionNumber >= (assessment.current_section || 1)) {
          await updateStatus.mutateAsync({
            id: assessment.id,
            status: 'in_progress',
            currentSection: sectionNumber,
          })
        }
      } finally {
        setIsSaving(false)
      }
    },
    [assessment?.id, assessment?.current_section, saveSection, updateStatus],
  )

  const goToSection = (section: SectionNumber) => {
    setCurrentSection(section)
  }

  const goNext = () => {
    if (currentSection < 10) {
      setCurrentSection((currentSection + 1) as SectionNumber)
    }
  }

  const goPrev = () => {
    if (currentSection > 1) {
      setCurrentSection((currentSection - 1) as SectionNumber)
    }
  }

  const getSectionData = (sectionNumber: SectionNumber): SectionData => {
    return (
      assessment?.sections?.find((s) => s.section_number === sectionNumber)
        ?.data || {}
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Assessment not found</p>
        <Button asChild>
          <Link href="/assessments">Back to Assessments</Link>
        </Button>
      </div>
    )
  }

  const renderSection = () => {
    const props = {
      assessmentId: assessment.id,
      data: getSectionData(currentSection),
      onSave: (data: SectionData, isCompleted?: boolean) =>
        handleSectionSave(currentSection, data, isCompleted),
      onNext: goNext,
      isHighRise,
      isSaving,
    }

    switch (currentSection) {
      case 1:
        return <SiteInformationSection {...props} site={assessment.site} />
      case 2:
        return <FireDoorsSection {...props} />
      case 3:
        return <HotWorksSection {...props} />
      case 4:
        return <EscapeRoutesSection {...props} />
      case 5:
        return <FireDetectionSection {...props} />
      case 6:
        return <EmergencyProceduresSection {...props} />
      case 7:
        return <HazardsSection {...props} />
      case 8:
        return <ActionsSection {...props} />
      case 9:
        return (
          <SummarySection
            {...props}
            hazards={assessment.hazards}
            actions={assessment.actions}
          />
        )
      case 10:
        return <SignOffSection {...props} assessment={assessment} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/assessments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {assessment.assessment_number}
            </h1>
            <p className="text-muted-foreground">
              {assessment.site?.name} • Section {currentSection} of 10
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <Save className="h-4 w-4 animate-pulse" />
              Saving...
            </span>
          )}
        </div>
      </div>

      {/* Mobile progress */}
      <div className="lg:hidden">
        <WizardStepIndicator
          currentSection={currentSection}
          completedSections={completedSections}
        />
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar navigation */}
        <aside className="hidden lg:block">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <WizardNavigation
                currentSection={currentSection}
                completedSections={completedSections}
                isHighRise={isHighRise}
                onSectionClick={goToSection}
              />
            </CardContent>
          </Card>
        </aside>

        {/* Section content */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">{renderSection()}</CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentSection === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="text-muted-foreground text-sm">
              Section {currentSection} of 10
            </div>

            <Button onClick={goNext} disabled={currentSection === 10}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
