'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/supabase/client'

// ============================================
// Types
// ============================================

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string
  settings?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invited_by?: string
  invited_at: string
  joined_at?: string
  // Joined data
  user?: {
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface CreateOrganizationInput {
  name: string
  slug?: string
  logo_url?: string
}

export interface InviteMemberInput {
  organization_id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
}

// ============================================
// Organization Queries
// ============================================

const ORGANIZATIONS_KEY = ['organizations']

/**
 * Fetch all organizations the current user belongs to
 */
export function useOrganizations() {
  const supabase = createClient()

  return useQuery({
    queryKey: ORGANIZATIONS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Organization[]
    },
  })
}

/**
 * Fetch a single organization by ID
 */
export function useOrganization(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...ORGANIZATIONS_KEY, id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Organization
    },
    enabled: !!id,
  })
}

/**
 * Fetch organization members
 */
export function useOrganizationMembers(organizationId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...ORGANIZATIONS_KEY, organizationId, 'members'],
    queryFn: async () => {
      if (!organizationId) return []

      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('role')

      if (error) throw error
      return data as OrganizationMember[]
    },
    enabled: !!organizationId,
  })
}

/**
 * Get current user's role in an organization
 */
export function useUserRole(organizationId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...ORGANIZATIONS_KEY, organizationId, 'my-role'],
    queryFn: async () => {
      if (!organizationId) return null

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single()

      if (error) return null
      return data.role as OrganizationMember['role']
    },
    enabled: !!organizationId,
  })
}

// ============================================
// Organization Mutations
// ============================================

/**
 * Create a new organization
 */
export function useCreateOrganization() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Generate slug from name if not provided
      const slug =
        input.slug ||
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 50)

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: input.name, slug, logo_url: input.logo_url })
        .select()
        .single()

      if (orgError) throw orgError

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        })

      if (memberError) {
        // Rollback org creation
        await supabase.from('organizations').delete().eq('id', org.id)
        throw memberError
      }

      return org as Organization
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY })
    },
  })
}

/**
 * Update an organization
 */
export function useUpdateOrganization() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<Organization> & { id: string }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Organization
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY })
      queryClient.setQueryData([...ORGANIZATIONS_KEY, data.id], data)
    },
  })
}

/**
 * Delete an organization
 */
export function useDeleteOrganization() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY })
      queryClient.removeQueries({ queryKey: [...ORGANIZATIONS_KEY, id] })
    },
  })
}

// ============================================
// Member Mutations
// ============================================

/**
 * Update a member's role
 */
export function useUpdateMemberRole() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      organizationId,
      role,
    }: {
      memberId: string
      organizationId: string
      role: OrganizationMember['role']
    }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error
      return { ...data, organizationId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...ORGANIZATIONS_KEY, data.organizationId, 'members'],
      })
    },
  })
}

/**
 * Remove a member from organization
 */
export function useRemoveMember() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      organizationId,
    }: {
      memberId: string
      organizationId: string
    }) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      return { memberId, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: [...ORGANIZATIONS_KEY, organizationId, 'members'],
      })
    },
  })
}

/**
 * Leave an organization
 */
export function useLeaveOrganization() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)

      if (error) throw error
      return organizationId
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_KEY })
      queryClient.removeQueries({ queryKey: [...ORGANIZATIONS_KEY, id] })
    },
  })
}
