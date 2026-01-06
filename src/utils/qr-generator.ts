/**
 * QR Code Generator Utility for Tenant Door Cards
 * Generates QR codes with color-coded backgrounds based on risk level
 */

import { RiskLevel, Tenant } from '@/types'

// Risk level colors for QR code backgrounds
export const QR_RISK_COLORS: Record<
  RiskLevel,
  { bg: string; border: string; text: string }
> = {
  critical: {
    bg: '#FEE2E2', // red-100
    border: '#EF4444', // red-500
    text: '#991B1B', // red-800
  },
  high: {
    bg: '#FFEDD5', // orange-100
    border: '#F97316', // orange-500
    text: '#9A3412', // orange-800
  },
  medium: {
    bg: '#FEF9C3', // yellow-100
    border: '#EAB308', // yellow-500
    text: '#854D0E', // yellow-800
  },
  low: {
    bg: '#DCFCE7', // green-100
    border: '#22C55E', // green-500
    text: '#166534', // green-800
  },
}

// Tailwind classes for risk level badges
export const QR_RISK_CLASSES: Record<
  RiskLevel,
  { bg: string; text: string; border: string }
> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-950',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-500',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-500',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-950',
    text: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-500',
  },
  low: {
    bg: 'bg-green-100 dark:bg-green-950',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-500',
  },
}

/**
 * Generate QR code data for a tenant
 * This creates a JSON string that encodes critical emergency info
 */
export function generateTenantQRData(tenant: Tenant): string {
  const qrData = {
    id: tenant.id,
    apt: tenant.apartment_number,
    floor: tenant.floor_number,
    name: tenant.tenant_name,
    risk: tenant.risk_level,
    occupants: tenant.number_of_occupants,
    // Critical emergency flags
    flags: {
      wheelchair: tenant.uses_wheelchair,
      mobility: tenant.has_mobility_issues,
      visual: tenant.has_visual_impairment,
      hearing: tenant.has_hearing_impairment,
      cognitive: tenant.has_cognitive_impairment,
      evacAssist: tenant.requires_assistance_evacuation,
      oxygen: tenant.oxygen_dependent,
    },
    // Medical info
    allergies: tenant.allergies || null,
    medical: tenant.medical_conditions || null,
    // Emergency contact
    contact: tenant.emergency_contact_name
      ? {
          name: tenant.emergency_contact_name,
          phone: tenant.emergency_contact_phone,
        }
      : null,
  }

  return JSON.stringify(qrData)
}

/**
 * Generate the URL that the QR code should point to
 */
export function generateTenantQRUrl(
  tenantId: string,
  baseUrl?: string,
): string {
  const base =
    baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/tenant/${tenantId}`
}

/**
 * Get disability icons/labels for display
 */
export function getTenantDisabilityFlags(tenant: Partial<Tenant>): Array<{
  key: string
  label: string
  icon: string
  critical: boolean
}> {
  const flags: Array<{
    key: string
    label: string
    icon: string
    critical: boolean
  }> = []

  if (tenant.uses_wheelchair) {
    flags.push({
      key: 'wheelchair',
      label: 'Wheelchair User',
      icon: '',
      critical: true,
    })
  }
  if (tenant.has_mobility_issues) {
    flags.push({
      key: 'mobility',
      label: 'Mobility Issues',
      icon: '',
      critical: true,
    })
  }
  if (tenant.requires_assistance_evacuation) {
    flags.push({
      key: 'evacAssist',
      label: 'Needs Evacuation Assistance',
      icon: '',
      critical: true,
    })
  }
  if (tenant.oxygen_dependent) {
    flags.push({
      key: 'oxygen',
      label: 'Oxygen Dependent',
      icon: '',
      critical: true,
    })
  }
  if (tenant.has_visual_impairment) {
    flags.push({
      key: 'visual',
      label: 'Visual Impairment',
      icon: '',
      critical: false,
    })
  }
  if (tenant.has_hearing_impairment) {
    flags.push({
      key: 'hearing',
      label: 'Hearing Impairment',
      icon: '',
      critical: false,
    })
  }
  if (tenant.has_cognitive_impairment) {
    flags.push({
      key: 'cognitive',
      label: 'Cognitive Impairment',
      icon: '',
      critical: false,
    })
  }

  return flags
}

/**
 * Get a summary line of tenant emergency info
 */
export function getTenantEmergencySummary(tenant: Partial<Tenant>): string {
  const flags = getTenantDisabilityFlags(tenant)
  const parts: string[] = []

  if (tenant.number_of_occupants && tenant.number_of_occupants > 1) {
    parts.push(`${tenant.number_of_occupants} occupants`)
  }

  if (flags.length > 0) {
    const criticalFlags = flags.filter((f) => f.critical)
    if (criticalFlags.length > 0) {
      parts.push(criticalFlags.map((f) => f.label).join(', '))
    }
  }

  if (tenant.allergies) {
    parts.push(`Allergies: ${tenant.allergies}`)
  }

  if (tenant.oxygen_dependent) {
    parts.push('Oxygen dependent')
  }

  return parts.join(' • ')
}

/**
 * Risk level display text
 */
export const RISK_LEVEL_TEXT: Record<RiskLevel, string> = {
  critical: 'CRITICAL RISK - Immediate Priority',
  high: 'HIGH RISK - Priority Assistance',
  medium: 'MEDIUM RISK - May Need Assistance',
  low: 'LOW RISK - Standard Evacuation',
}
