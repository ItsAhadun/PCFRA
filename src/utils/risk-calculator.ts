/**
 * Risk Calculator Utility
 * Implements the 5×5 Risk Matrix calculation: Risk = Severity × Likelihood
 */

import { RiskLevel, RiskScore } from '@/types'

export const CRITICAL_THRESHOLD = 15

/**
 * Calculate risk score from severity and likelihood
 */
export function calculateRiskScore(
  severity: RiskScore,
  likelihood: RiskScore,
): number {
  return severity * likelihood
}

/**
 * Determine risk level based on score
 * - Critical: 15-25 (requires immediate action)
 * - High: 10-14
 * - Medium: 5-9
 * - Low: 1-4
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 15) return 'critical'
  if (score >= 10) return 'high'
  if (score >= 5) return 'medium'
  return 'low'
}

/**
 * Check if score is above critical threshold
 */
export function isCriticalRisk(score: number): boolean {
  return score >= CRITICAL_THRESHOLD
}

/**
 * Get risk level directly from severity and likelihood
 */
export function calculateRisk(
  severity: RiskScore,
  likelihood: RiskScore,
): {
  score: number
  level: RiskLevel
  isCritical: boolean
} {
  const score = calculateRiskScore(severity, likelihood)
  const level = getRiskLevel(score)
  const isCritical = isCriticalRisk(score)

  return { score, level, isCritical }
}

/**
 * Risk level descriptions for UI display
 */
export const RISK_LEVEL_DESCRIPTIONS: Record<RiskLevel, string> = {
  low: 'Acceptable risk - monitor and review',
  medium: 'Moderate risk - implement controls within reasonable timeframe',
  high: 'Significant risk - implement controls as priority',
  critical:
    'Unacceptable risk - immediate action required before work continues',
}

/**
 * Severity scale descriptions (1-5)
 */
export const SEVERITY_DESCRIPTIONS: Record<RiskScore, string> = {
  1: 'Negligible - Minor injury, first aid only',
  2: 'Slight - Minor injury requiring medical treatment',
  3: 'Moderate - Serious injury, possible hospitalization',
  4: 'Severe - Major injury, permanent disability',
  5: 'Catastrophic - Fatality or multiple casualties',
}

/**
 * Likelihood scale descriptions (1-5)
 */
export const LIKELIHOOD_DESCRIPTIONS: Record<RiskScore, string> = {
  1: 'Rare - Unlikely to occur',
  2: 'Unlikely - Could occur but not expected',
  3: 'Possible - May occur occasionally',
  4: 'Likely - Will probably occur',
  5: 'Almost Certain - Expected to occur frequently',
}

/**
 * Generate a 5x5 risk matrix for display
 */
export function generateRiskMatrix(): Array<{
  severity: RiskScore
  likelihood: RiskScore
  score: number
  level: RiskLevel
}> {
  const matrix: Array<{
    severity: RiskScore
    likelihood: RiskScore
    score: number
    level: RiskLevel
  }> = []

  for (let s = 5; s >= 1; s--) {
    for (let l = 1; l <= 5; l++) {
      const score = s * l
      matrix.push({
        severity: s as RiskScore,
        likelihood: l as RiskScore,
        score,
        level: getRiskLevel(score),
      })
    }
  }

  return matrix
}

/**
 * Calculate overall risk score from multiple hazards
 * Uses the highest risk score as the overall
 */
export function calculateOverallRisk(hazards: Array<{ risk_score: number }>): {
  score: number
  level: RiskLevel
  isCritical: boolean
} {
  if (hazards.length === 0) {
    return { score: 0, level: 'low', isCritical: false }
  }

  const maxScore = Math.max(...hazards.map((h) => h.risk_score))
  const level = getRiskLevel(maxScore)
  const isCritical = isCriticalRisk(maxScore)

  return { score: maxScore, level, isCritical }
}

/**
 * Get color class for risk level (Tailwind)
 */
export function getRiskColorClass(level: RiskLevel): {
  bg: string
  text: string
  border: string
} {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-500',
        text: 'text-red-500',
        border: 'border-red-500',
      }
    case 'high':
      return {
        bg: 'bg-orange-500',
        text: 'text-orange-500',
        border: 'border-orange-500',
      }
    case 'medium':
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-500',
        border: 'border-yellow-500',
      }
    case 'low':
    default:
      return {
        bg: 'bg-green-500',
        text: 'text-green-500',
        border: 'border-green-500',
      }
  }
}
