'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/supabase/client'
import type { Site, CreateSiteInput, UpdateSiteInput } from '@/types'
import { sanitizeFormData } from '@/utils/sanitize'

const SITES_KEY = ['sites']

/**
 * Fetch all sites for the current user
 */
export function useSites() {
  const supabase = createClient()

  return useQuery({
    queryKey: SITES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Site[]
    },
  })
}

/**
 * Fetch a single site by ID
 */
export function useSite(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...SITES_KEY, id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Site
    },
    enabled: !!id,
  })
}

/**
 * Create a new site
 */
export function useCreateSite() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSiteInput) => {
      // Sanitize input data
      const sanitizedInput = sanitizeFormData(input)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('sites')
        .insert({ ...sanitizedInput, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as Site
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITES_KEY })
    },
  })
}

/**
 * Update a site
 */
export function useUpdateSite() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSiteInput) => {
      // Sanitize input data
      const sanitizedInput = sanitizeFormData(input)

      const { data, error } = await supabase
        .from('sites')
        .update(sanitizedInput)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Site
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SITES_KEY })
      queryClient.setQueryData([...SITES_KEY, data.id], data)
    },
  })
}

/**
 * Delete a site
 */
export function useDeleteSite() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sites').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: SITES_KEY })
      queryClient.removeQueries({ queryKey: [...SITES_KEY, id] })
    },
  })
}
