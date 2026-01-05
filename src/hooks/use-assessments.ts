'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/supabase/client'
import type {
  Assessment,
  CreateAssessmentInput,
  AssessmentSection,
  SectionNumber,
  SectionData,
  SECTION_NAMES,
} from '@/types'

const ASSESSMENTS_KEY = ['assessments']

/**
 * Fetch all assessments for the current user
 */
export function useAssessments(siteId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: siteId ? [...ASSESSMENTS_KEY, 'site', siteId] : ASSESSMENTS_KEY,
    queryFn: async () => {
      let query = supabase
        .from('assessments')
        .select(
          `
          *,
          site:sites(*)
        `,
        )
        .order('created_at', { ascending: false })

      if (siteId) {
        query = query.eq('site_id', siteId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Assessment[]
    },
  })
}

/**
 * Fetch a single assessment with all related data
 */
export function useAssessment(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...ASSESSMENTS_KEY, id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('assessments')
        .select(
          `
          *,
          site:sites(*),
          sections:assessment_sections(*),
          hazards:hazards(*),
          actions:actions(*)
        `,
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Assessment
    },
    enabled: !!id,
  })
}

/**
 * Create a new assessment
 */
export function useCreateAssessment() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAssessmentInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate assessment number
      const { count } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })

      const assessmentNumber = `FRA-${String((count || 0) + 1).padStart(4, '0')}`

      // Create assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          ...input,
          user_id: user.id,
          assessment_number: assessmentNumber,
          status: 'draft',
          current_section: 1,
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      // Create all sections
      const sectionNames: Record<number, string> = {
        1: 'Site Information',
        2: 'Fire Doors',
        3: 'Hot Works',
        4: 'Escape Routes',
        5: 'Fire Detection',
        6: 'Emergency Procedures',
        7: 'Hazard Identification',
        8: 'Action Plan',
        9: 'Summary',
        10: 'Sign Off',
      }

      const sections = Array.from({ length: 10 }, (_, i) => ({
        assessment_id: assessment.id,
        section_number: i + 1,
        section_name: sectionNames[i + 1],
        is_completed: false,
        is_applicable: true,
        data: {},
      }))

      const { error: sectionsError } = await supabase
        .from('assessment_sections')
        .insert(sections)

      if (sectionsError) throw sectionsError

      return assessment as Assessment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY })
    },
  })
}

/**
 * Update assessment status
 */
export function useUpdateAssessmentStatus() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      currentSection,
    }: {
      id: string
      status?: Assessment['status']
      currentSection?: number
    }) => {
      const updates: Partial<Assessment> = {}
      if (status) updates.status = status
      if (currentSection) updates.current_section = currentSection

      const { data, error } = await supabase
        .from('assessments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Assessment
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...ASSESSMENTS_KEY, data.id] })
    },
  })
}

/**
 * Save section data
 */
export function useSaveSection() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      assessmentId,
      sectionNumber,
      data,
      isCompleted = false,
      notes,
    }: {
      assessmentId: string
      sectionNumber: SectionNumber
      data: SectionData
      isCompleted?: boolean
      notes?: string
    }) => {
      const updates: Partial<AssessmentSection> = {
        data,
        is_completed: isCompleted,
        notes,
      }

      if (isCompleted) {
        updates.completed_at = new Date().toISOString()
      }

      const { data: section, error } = await supabase
        .from('assessment_sections')
        .update(updates)
        .eq('assessment_id', assessmentId)
        .eq('section_number', sectionNumber)
        .select()
        .single()

      if (error) throw error
      return section as AssessmentSection
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...ASSESSMENTS_KEY, variables.assessmentId],
      })
    },
  })
}

/**
 * Sign off assessment
 */
export function useSignOffAssessment() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      signatureData,
      nextReviewDate,
    }: {
      id: string
      signatureData: string
      nextReviewDate?: string
    }) => {
      const { data, error } = await supabase
        .from('assessments')
        .update({
          status: 'signed_off',
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          next_review_date: nextReviewDate,
        })
        .select()
        .single()

      if (error) throw error
      return data as Assessment
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...ASSESSMENTS_KEY, data.id] })
    },
  })
}

/**
 * Delete an assessment
 */
export function useDeleteAssessment() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assessments').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ASSESSMENTS_KEY })
      queryClient.removeQueries({ queryKey: [...ASSESSMENTS_KEY, id] })
    },
  })
}
