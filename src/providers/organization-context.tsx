'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useOrganizations, type Organization } from '@/hooks/use-organization'
import { getStorageItem, setStorageItem } from '@/utils/offline-storage'

interface OrganizationContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  setCurrentOrganization: (org: Organization | null) => void
  isLoading: boolean
  isPersonalMode: boolean
  setPersonalMode: (enabled: boolean) => void
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
)

const CURRENT_ORG_KEY = 'current_organization_id'

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: organizations = [], isLoading } = useOrganizations()

  // Use lazy initialization to load from storage
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return getStorageItem<string>(CURRENT_ORG_KEY) || null
  })
  const [isPersonalMode, setPersonalMode] = useState(false)

  // Derive if we need to set a default org (no effect setState needed)
  const needsDefaultOrg =
    !isLoading && organizations.length > 0 && !currentOrgId

  // Handle setting default organization via a derived value + callback
  const effectiveOrgId = (() => {
    if (currentOrgId) return currentOrgId
    if (needsDefaultOrg) {
      const savedOrgId = getStorageItem<string>(CURRENT_ORG_KEY)
      const validOrg = organizations.find((org) => org.id === savedOrgId)
      return validOrg?.id || organizations[0]?.id || null
    }
    return null
  })()

  const currentOrganization =
    organizations.find((org) => org.id === effectiveOrgId) || null

  const handleSetCurrentOrganization = (org: Organization | null) => {
    setCurrentOrgId(org?.id || null)
    if (org) {
      setStorageItem(CURRENT_ORG_KEY, org.id)
      setPersonalMode(false)
    }
  }

  const value: OrganizationContextType = {
    organizations,
    currentOrganization: isPersonalMode ? null : currentOrganization,
    setCurrentOrganization: handleSetCurrentOrganization,
    isLoading,
    isPersonalMode,
    setPersonalMode,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error(
      'useOrganizationContext must be used within an OrganizationProvider',
    )
  }
  return context
}

/**
 * Hook to check if user has permission for an action
 */
export function useOrgPermission(
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer' = 'viewer',
) {
  const { currentOrganization, isPersonalMode } = useOrganizationContext()

  // Personal mode = full access
  if (isPersonalMode) {
    return { hasPermission: true, role: 'owner' as const }
  }

  // No org = no access to org features
  if (!currentOrganization) {
    return { hasPermission: false, role: null }
  }

  // For now, assume user has access (role would come from useUserRole hook)
  // This is a simplified version - in production, fetch actual role
  const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 }
  const requiredLevel = roleHierarchy[requiredRole]

  // Default to member role for simplicity
  const userRole = 'member' as const
  const userLevel = roleHierarchy[userRole]

  return {
    hasPermission: userLevel >= requiredLevel,
    role: userRole,
  }
}
