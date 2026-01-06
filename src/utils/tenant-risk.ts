/**
 * Tenant Risk Level Calculator
 * Calculates risk level based on disability conditions and floor number
 */

import { RiskLevel } from '@/types'

interface TenantRiskFactors {
  uses_wheelchair: boolean
  has_mobility_issues: boolean
  requires_assistance_evacuation: boolean
  oxygen_dependent: boolean
  has_visual_impairment: boolean
  has_hearing_impairment: boolean
  has_cognitive_impairment: boolean
  floor_number: number
}

/**
 * Calculate tenant risk level based on their conditions and floor
 * This mirrors the database GENERATED column logic
 */
export function calculateTenantRiskLevel(
  factors: TenantRiskFactors,
): RiskLevel {
  const {
    uses_wheelchair,
    has_mobility_issues,
    requires_assistance_evacuation,
    oxygen_dependent,
    has_visual_impairment,
    has_hearing_impairment,
    has_cognitive_impairment,
    floor_number,
  } = factors

  // Critical: Wheelchair or oxygen dependent on floor 3+
  if ((uses_wheelchair || oxygen_dependent) && floor_number >= 3) {
    return 'critical'
  }

  // High: Mobility issues or needs evac assistance on floor 2+
  if (
    (has_mobility_issues || requires_assistance_evacuation) &&
    floor_number >= 2
  ) {
    return 'high'
  }

  // High: Wheelchair or oxygen dependent on any floor
  if (uses_wheelchair || oxygen_dependent) {
    return 'high'
  }

  // Medium: Mobility issues or needs evacuation assistance
  if (has_mobility_issues || requires_assistance_evacuation) {
    return 'medium'
  }

  // Medium: Sensory or cognitive impairments
  if (
    has_visual_impairment ||
    has_hearing_impairment ||
    has_cognitive_impairment
  ) {
    return 'medium'
  }

  // Low: No special conditions
  return 'low'
}

/**
 * Get risk level description for display
 */
export const TENANT_RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
  critical: 'Requires immediate priority during evacuation',
  high: 'Requires priority assistance during evacuation',
  medium: 'May require some assistance during evacuation',
  low: 'Can evacuate independently',
}

/**
 * Get recommended actions for each risk level
 */
export const TENANT_RISK_ACTIONS: Record<RiskLevel, string[]> = {
  critical: [
    'Assign dedicated evacuation personnel',
    'Pre-position evacuation equipment nearby',
    'Include in all fire drill priority lists',
    'Consider lower floor accommodation',
  ],
  high: [
    'Include in priority evacuation list',
    'Ensure clear escape routes',
    'Brief fire wardens on location',
  ],
  medium: [
    'Note special requirements in fire plan',
    'Ensure visual/audible alarms as needed',
  ],
  low: ['Standard evacuation procedures apply'],
}
