'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/supabase/client'
import type { Action, CreateActionInput, UpdateActionInput } from '@/types'

const ACTIONS_KEY = ['actions']
const ASSESSMENTS_KEY = ['assessments']

/**
 * Fetch all actions for an assessment
 */
export function useActions(assessmentId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...ACTIONS_KEY, assessmentId],
    queryFn: async () => {
      if (!assessmentId) return []

      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('priority', { ascending: true })
        .order('target_date', { ascending: true })

      if (error) throw error
      return data as Action[]
    },
    enabled: !!assessmentId,
  })
}

/**
 * Fetch actions for a specific hazard
 */
export function useHazardActions(hazardId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...ACTIONS_KEY, 'hazard', hazardId],
    queryFn: async () => {
      if (!hazardId) return []

      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('hazard_id', hazardId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Action[]
    },
    enabled: !!hazardId,
  })
}

/**
 * Create a new action
 */
export function useCreateAction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateActionInput) => {
      const { data, error } = await supabase
        .from('actions')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as Action
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...ACTIONS_KEY, data.assessment_id],
      })
      if (data.hazard_id) {
        queryClient.invalidateQueries({
          queryKey: [...ACTIONS_KEY, 'hazard', data.hazard_id],
        })
      }
      queryClient.invalidateQueries({
        queryKey: [...ASSESSMENTS_KEY, data.assessment_id],
      })
    },
  })
}

/**
 * Update an action
 */
export function useUpdateAction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateActionInput) => {
      const updates: Partial<Action> = { ...input }

      if (input.status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Action
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...ACTIONS_KEY, data.assessment_id],
      })
      if (data.hazard_id) {
        queryClient.invalidateQueries({
          queryKey: [...ACTIONS_KEY, 'hazard', data.hazard_id],
        })
      }
      queryClient.invalidateQueries({
        queryKey: [...ASSESSMENTS_KEY, data.assessment_id],
      })
    },
  })
}

/**
 * Delete an action
 */
export function useDeleteAction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      assessmentId,
      hazardId,
    }: {
      id: string
      assessmentId: string
      hazardId?: string
    }) => {
      const { error } = await supabase.from('actions').delete().eq('id', id)

      if (error) throw error
      return { id, assessmentId, hazardId }
    },
    onSuccess: ({ assessmentId, hazardId }) => {
      queryClient.invalidateQueries({
        queryKey: [...ACTIONS_KEY, assessmentId],
      })
      if (hazardId) {
        queryClient.invalidateQueries({
          queryKey: [...ACTIONS_KEY, 'hazard', hazardId],
        })
      }
      queryClient.invalidateQueries({
        queryKey: [...ASSESSMENTS_KEY, assessmentId],
      })
    },
  })
}

/**
 * Get pending/overdue actions count
 */
export function useActionStats(assessmentId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...ACTIONS_KEY, 'stats', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return { pending: 0, overdue: 0, completed: 0 }

      const today = new Date().toISOString().split('T')[0]

      // Get all actions for the assessment
      const { data: actions, error } = await supabase
        .from('actions')
        .select('status, target_date')
        .eq('assessment_id', assessmentId)

      if (error) throw error

      let pending = 0
      let overdue = 0
      let completed = 0

      actions?.forEach((action) => {
        if (action.status === 'completed') {
          completed++
        } else if (action.target_date && action.target_date < today) {
          overdue++
        } else {
          pending++
        }
      })

      return { pending, overdue, completed }
    },
    enabled: !!assessmentId,
  })
}
