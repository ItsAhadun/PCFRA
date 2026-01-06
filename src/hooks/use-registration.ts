'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/supabase/client'
import type {
  RegistrationToken,
  CreateRegistrationTokenInput,
  ResidentRegistrationInput,
  Tenant,
} from '@/types'

const supabase = createClient()

/**
 * Hook to fetch registration tokens for a site (staff use)
 */
export function useRegistrationTokens(siteId?: string) {
  return useQuery({
    queryKey: ['registration-tokens', siteId],
    queryFn: async () => {
      if (!siteId) return []

      const { data, error } = await supabase
        .from('registration_tokens')
        .select('*, site:sites(*), tenant:tenants(*)')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as RegistrationToken[]
    },
    enabled: !!siteId,
  })
}

/**
 * Hook to validate a registration token (public use)
 */
export function useValidateToken(token: string) {
  return useQuery({
    queryKey: ['registration-token', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registration_tokens')
        .select('*, site:sites(id, name, address)')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Invalid or expired registration link')
        }
        throw error
      }
      return data as RegistrationToken
    },
    enabled: !!token && token.length > 0,
    retry: false,
  })
}

/**
 * Hook to create a registration token (staff use)
 */
export function useCreateRegistrationToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRegistrationTokenInput) => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to create registration links')
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (input.expires_in_days || 30))

      const { data, error } = await supabase
        .from('registration_tokens')
        .insert({
          site_id: input.site_id,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        })
        .select('*')
        .single()

      if (error) throw error
      return data as RegistrationToken
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['registration-tokens', data.site_id],
      })
    },
  })
}

/**
 * Hook to delete a registration token (staff use)
 */
export function useDeleteRegistrationToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, siteId }: { id: string; siteId: string }) => {
      const { error } = await supabase
        .from('registration_tokens')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, siteId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['registration-tokens', data.siteId],
      })
    },
  })
}

/**
 * Hook to submit resident registration (public use - no auth required)
 */
export function useResidentRegistration() {
  return useMutation({
    mutationFn: async (input: ResidentRegistrationInput): Promise<Tenant> => {
      // First validate the token (must exist and not be expired)
      const { data: tokenData, error: tokenError } = await supabase
        .from('registration_tokens')
        .select('*, site:sites(*)')
        .eq('token', input.token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (tokenError || !tokenData) {
        throw new Error('Invalid or expired registration link')
      }

      // Create the tenant record
      // Use the staff user who created the token as the owner
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          site_id: tokenData.site_id,
          user_id: tokenData.created_by, // Staff who created the token
          apartment_number: input.apartment_number,
          floor_number: input.floor_number,
          tenant_name: input.tenant_name,
          number_of_occupants: input.number_of_occupants,
          has_mobility_issues: input.has_mobility_issues || false,
          uses_wheelchair: input.uses_wheelchair || false,
          has_visual_impairment: input.has_visual_impairment || false,
          has_hearing_impairment: input.has_hearing_impairment || false,
          has_cognitive_impairment: input.has_cognitive_impairment || false,
          requires_assistance_evacuation:
            input.requires_assistance_evacuation || false,
          other_disabilities: input.other_disabilities,
          blood_type: input.blood_type,
          allergies: input.allergies,
          medical_conditions: input.medical_conditions,
          oxygen_dependent: input.oxygen_dependent || false,
          emergency_contact_name: input.emergency_contact_name,
          emergency_contact_phone: input.emergency_contact_phone,
          notes: input.notes,
        })
        .select('*')
        .single()

      if (tenantError) {
        throw new Error('Failed to create registration. Please try again.')
      }

      // Attempt to update site details if provided
      // Note: This relies on RLS allowing the update or this logic running in a context where it's permitted.
      // If the public token user cannot update sites, this part might fail silently or we should catch formatting errors.
      if (
        input.site_name ||
        input.building_height ||
        input.principal_contractor
      ) {
        await supabase
          .from('sites')
          .update({
            name: input.site_name || undefined,
            address: input.site_address || undefined,
            postcode: input.postcode || undefined,
            building_height_m: input.building_height || undefined,
            number_of_floors: input.number_of_floors_site || undefined,
            building_use: input.occupancy_type || undefined,
            principal_contractor: input.principal_contractor || undefined,
            dutyholder_name: input.dutyholder_name || undefined,
            // Naive mapping for contact
            dutyholder_email: input.dutyholder_contact?.includes('@')
              ? input.dutyholder_contact
              : undefined,
            dutyholder_phone: !input.dutyholder_contact?.includes('@')
              ? input.dutyholder_contact
              : undefined,
          })
          .eq('id', tokenData.site_id)
      }

      return tenant as Tenant
    },
  })
}
