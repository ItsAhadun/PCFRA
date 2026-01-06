'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/supabase/client'
import type { Tenant, CreateTenantInput, UpdateTenantInput } from '@/types'
import { sanitizeFormData } from '@/utils/sanitize'

const TENANTS_KEY = ['tenants']
const SITES_KEY = ['sites']

/**
 * Fetch all tenants for a site
 */
export function useTenants(siteId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...TENANTS_KEY, siteId],
    queryFn: async () => {
      if (!siteId) return []

      const { data, error } = await supabase
        .from('tenants')
        .select('*, site:sites(*)')
        .eq('site_id', siteId)
        .order('floor_number', { ascending: true })
        .order('apartment_number', { ascending: true })

      if (error) throw error
      return data as Tenant[]
    },
    enabled: !!siteId,
  })
}

/**
 * Fetch all tenants across all sites for current user
 */
export function useAllTenants() {
  const supabase = createClient()

  return useQuery({
    queryKey: [...TENANTS_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, site:sites(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Tenant[]
    },
  })
}

/**
 * Fetch a single tenant by ID
 */
export function useTenant(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...TENANTS_KEY, 'single', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('tenants')
        .select('*, site:sites(*)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Tenant
    },
    enabled: !!id,
  })
}

/**
 * Fetch a tenant by ID for public QR scan (no auth required)
 */
export function useTenantPublic(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...TENANTS_KEY, 'public', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('tenants')
        .select(
          `
          id,
          apartment_number,
          floor_number,
          tenant_name,
          has_mobility_issues,
          uses_wheelchair,
          has_visual_impairment,
          has_hearing_impairment,
          has_cognitive_impairment,
          requires_assistance_evacuation,
          allergies,
          medical_conditions,
          oxygen_dependent,
          emergency_contact_name,
          emergency_contact_phone,
          number_of_occupants,
          risk_level
        `,
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Partial<Tenant>
    },
    enabled: !!id,
  })
}

/**
 * Create a new tenant
 */
export function useCreateTenant() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      // Sanitize input data
      const sanitizedInput = sanitizeFormData(input)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tenants')
        .insert({ ...sanitizedInput, user_id: user.id })
        .select('*, site:sites(*)')
        .single()

      if (error) throw error
      return data as Tenant
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...TENANTS_KEY, data.site_id],
      })
      queryClient.invalidateQueries({
        queryKey: [...TENANTS_KEY, 'all'],
      })
    },
  })
}

/**
 * Update a tenant
 */
export function useUpdateTenant() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTenantInput) => {
      // Sanitize input data
      const sanitizedInput = sanitizeFormData(input)

      const { data, error } = await supabase
        .from('tenants')
        .update(sanitizedInput)
        .eq('id', id)
        .select('*, site:sites(*)')
        .single()

      if (error) throw error
      return data as Tenant
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...TENANTS_KEY, data.site_id],
      })
      queryClient.invalidateQueries({
        queryKey: [...TENANTS_KEY, 'single', data.id],
      })
      queryClient.invalidateQueries({
        queryKey: [...TENANTS_KEY, 'all'],
      })
    },
  })
}

/**
 * Delete a tenant
 */
export function useDeleteTenant() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, siteId }: { id: string; siteId: string }) => {
      const { error } = await supabase.from('tenants').delete().eq('id', id)

      if (error) throw error
      return { id, siteId }
    },
    onSuccess: ({ id, siteId }) => {
      queryClient.invalidateQueries({
        queryKey: [...TENANTS_KEY, siteId],
      })
      queryClient.removeQueries({ queryKey: [...TENANTS_KEY, 'single', id] })
      queryClient.invalidateQueries({
        queryKey: [...TENANTS_KEY, 'all'],
      })
    },
  })
}

/**
 * Get tenant count by risk level for a site
 */
export function useTenantRiskStats(siteId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...TENANTS_KEY, 'risk-stats', siteId],
    queryFn: async () => {
      if (!siteId) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 }

      const { data, error } = await supabase
        .from('tenants')
        .select('risk_level')
        .eq('site_id', siteId)

      if (error) throw error

      const stats = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: data?.length || 0,
      }

      data?.forEach((tenant) => {
        if (tenant.risk_level === 'critical') stats.critical++
        else if (tenant.risk_level === 'high') stats.high++
        else if (tenant.risk_level === 'medium') stats.medium++
        else stats.low++
      })

      return stats
    },
    enabled: !!siteId,
  })
}
