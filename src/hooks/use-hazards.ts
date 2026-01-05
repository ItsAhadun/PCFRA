'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/supabase/client'
import type { Hazard, CreateHazardInput, UpdateHazardInput } from '@/types'

const HAZARDS_KEY = ['hazards']
const ASSESSMENTS_KEY = ['assessments']

/**
 * Fetch all hazards for an assessment
 */
export function useHazards(assessmentId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...HAZARDS_KEY, assessmentId],
    queryFn: async () => {
      if (!assessmentId) return []

      const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Hazard[]
    },
    enabled: !!assessmentId,
  })
}

/**
 * Fetch a single hazard
 */
export function useHazard(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...HAZARDS_KEY, 'single', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('hazards')
        .select('*, actions:actions(*)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Hazard
    },
    enabled: !!id,
  })
}

/**
 * Create a new hazard
 */
export function useCreateHazard() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateHazardInput) => {
      const { data, error } = await supabase
        .from('hazards')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as Hazard
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...HAZARDS_KEY, data.assessment_id],
      })
      queryClient.invalidateQueries({
        queryKey: [...ASSESSMENTS_KEY, data.assessment_id],
      })
    },
  })
}

/**
 * Update a hazard
 */
export function useUpdateHazard() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateHazardInput) => {
      const updates: Partial<Hazard> = { ...input }

      if (input.is_resolved) {
        updates.resolved_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('hazards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Hazard
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...HAZARDS_KEY, data.assessment_id],
      })
      queryClient.invalidateQueries({
        queryKey: [...HAZARDS_KEY, 'single', data.id],
      })
      queryClient.invalidateQueries({
        queryKey: [...ASSESSMENTS_KEY, data.assessment_id],
      })
    },
  })
}

/**
 * Delete a hazard
 */
export function useDeleteHazard() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      assessmentId,
    }: {
      id: string
      assessmentId: string
    }) => {
      const { error } = await supabase.from('hazards').delete().eq('id', id)

      if (error) throw error
      return { id, assessmentId }
    },
    onSuccess: ({ id, assessmentId }) => {
      queryClient.invalidateQueries({
        queryKey: [...HAZARDS_KEY, assessmentId],
      })
      queryClient.removeQueries({ queryKey: [...HAZARDS_KEY, 'single', id] })
      queryClient.invalidateQueries({
        queryKey: [...ASSESSMENTS_KEY, assessmentId],
      })
    },
  })
}

/**
 * Upload hazard photo
 */
export function useUploadHazardPhoto() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      hazardId,
      file,
      assessmentId,
    }: {
      hazardId: string
      file: File
      assessmentId: string
    }) => {
      // Upload to Supabase Storage
      const fileName = `${hazardId}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hazard-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('hazard-photos').getPublicUrl(fileName)

      // Update hazard with new photo URL
      const { data: hazard } = await supabase
        .from('hazards')
        .select('photo_urls')
        .eq('id', hazardId)
        .single()

      const photoUrls = [...(hazard?.photo_urls || []), publicUrl]

      const { data, error } = await supabase
        .from('hazards')
        .update({ photo_urls: photoUrls })
        .eq('id', hazardId)
        .select()
        .single()

      if (error) throw error
      return { hazard: data as Hazard, photoUrl: publicUrl }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: HAZARDS_KEY })
    },
  })
}

/**
 * Get critical hazards count for an assessment
 */
export function useCriticalHazardsCount(assessmentId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...HAZARDS_KEY, 'critical-count', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return 0

      const { count, error } = await supabase
        .from('hazards')
        .select('*', { count: 'exact', head: true })
        .eq('assessment_id', assessmentId)
        .eq('risk_level', 'critical')
        .eq('is_resolved', false)

      if (error) throw error
      return count || 0
    },
    enabled: !!assessmentId,
  })
}
