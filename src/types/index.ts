// PCFRA Type Definitions

// ============================================
// Database Entity Types
// ============================================

export interface Site {
  id: string
  user_id: string
  name: string
  address: string
  postcode?: string
  building_height_m?: number
  number_of_floors?: number
  building_use?: string
  construction_phase?: string
  dutyholder_name?: string
  dutyholder_email?: string
  dutyholder_phone?: string
  principal_contractor?: string
  created_at: string
  updated_at: string
}

export interface Assessment {
  id: string
  site_id: string
  user_id: string
  assessment_number?: string
  status: AssessmentStatus
  current_section: number
  overall_risk_level?: RiskLevel
  overall_risk_score?: number
  is_high_rise?: boolean
  assessor_name?: string
  assessment_date: string
  next_review_date?: string
  signature_data?: string
  signed_at?: string
  pdf_url?: string
  created_at: string
  updated_at: string
  // Joined data
  site?: Site
  sections?: AssessmentSection[]
  hazards?: Hazard[]
  actions?: Action[]
}

export interface AssessmentSection {
  id: string
  assessment_id: string
  section_number: SectionNumber
  section_name: string
  is_completed: boolean
  is_applicable: boolean
  notes?: string
  data: SectionData
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Hazard {
  id: string
  assessment_id: string
  location: string
  description: string
  hazard_type?: HazardType
  severity: RiskScore
  likelihood: RiskScore
  risk_score: number
  risk_level: RiskLevel
  control_measures?: string
  photo_urls: string[]
  is_resolved: boolean
  resolved_at?: string
  created_at: string
  updated_at: string
  // Joined data
  actions?: Action[]
}

export interface Action {
  id: string
  assessment_id: string
  hazard_id?: string
  action_description: string
  priority: Priority
  assigned_to?: string
  assigned_role?: string
  target_date?: string
  status: ActionStatus
  completion_notes?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  entity_type: EntityType
  entity_id: string
  action: AuditAction
  changes?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface Tenant {
  id: string
  site_id: string
  user_id: string
  apartment_number: string
  floor_number: number
  tenant_name: string
  // Disability and mobility information
  has_mobility_issues: boolean
  uses_wheelchair: boolean
  has_visual_impairment: boolean
  has_hearing_impairment: boolean
  has_cognitive_impairment: boolean
  requires_assistance_evacuation: boolean
  other_disabilities?: string
  // Medical information
  blood_type?: string
  allergies?: string
  medical_conditions?: string
  oxygen_dependent: boolean
  // Emergency contact
  emergency_contact_name?: string
  emergency_contact_phone?: string
  // Additional info
  notes?: string
  number_of_occupants: number
  // Auto-calculated
  risk_level: RiskLevel
  qr_code_url?: string
  created_at: string
  updated_at: string
  // Joined data
  site?: Site
}

export interface RegistrationToken {
  id: string
  site_id: string
  token: string
  expires_at: string
  used_at?: string
  tenant_id?: string
  created_at: string
  created_by?: string
  // Joined data
  site?: Site
  tenant?: Tenant
}

// ============================================
// Enum Types
// ============================================

export type AssessmentStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'signed_off'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type RiskScore = 1 | 2 | 3 | 4 | 5

export type Priority = 'critical' | 'high' | 'medium' | 'low'

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

export type EntityType = 'site' | 'assessment' | 'hazard' | 'action' | 'tenant'

export type AuditAction = 'create' | 'update' | 'delete' | 'sign' | 'export'

export type SectionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type HazardType =
  | 'fire_load'
  | 'ignition_source'
  | 'means_of_escape'
  | 'fire_doors'
  | 'fire_detection'
  | 'emergency_lighting'
  | 'signage'
  | 'hot_works'
  | 'electrical'
  | 'storage'
  | 'housekeeping'
  | 'other'

// ============================================
// Section Data Types
// ============================================

export interface SectionData {
  [key: string]: unknown
}

export interface SiteInformationData extends SectionData {
  site_contact?: string
  site_contact_phone?: string
  building_description?: string
  occupancy_type?: string
  max_occupancy?: number
  working_hours?: string
  high_rise_notes?: string
}

export interface FireDoorsData extends SectionData {
  doors_inspected: boolean
  doors_condition: 'good' | 'fair' | 'poor'
  self_closing_working: boolean
  gaps_acceptable: boolean
  signage_present: boolean
  defects_noted?: string
}

export interface HotWorksData extends SectionData {
  hot_works_present: boolean
  permit_system_in_place: boolean
  fire_watch_procedures: boolean
  extinguishers_available: boolean
  combustibles_cleared: boolean
  notes?: string
}

export interface EscapeRoutesData extends SectionData {
  routes_clear: boolean
  routes_adequately_lit: boolean
  emergency_lighting_tested: boolean
  exit_signs_visible: boolean
  assembly_point_identified: boolean
  routes_sufficient_width: boolean
  notes?: string
}

export interface FireDetectionData extends SectionData {
  system_type?: 'manual' | 'automatic' | 'combined'
  last_test_date?: string
  call_points_accessible: boolean
  detectors_appropriate: boolean
  alarm_audible: boolean
  maintenance_contract: boolean
  notes?: string
}

export interface EmergencyProceduresData extends SectionData {
  evacuation_plan_exists: boolean
  plan_displayed: boolean
  fire_marshals_trained: boolean
  drills_conducted: boolean
  last_drill_date?: string
  emergency_contacts_posted: boolean
  notes?: string
}

export interface SummaryData extends SectionData {
  overall_findings?: string
  key_recommendations?: string
  compliance_statement?: string
}

export interface SignOffData extends SectionData {
  assessor_declaration: boolean
  dutyholder_notified: boolean
  review_date_set: boolean
}

// ============================================
// Form Types
// ============================================

export interface CreateSiteInput {
  name: string
  address: string
  postcode?: string
  building_height_m?: number
  number_of_floors?: number
  building_use?: string
  construction_phase?: string
  dutyholder_name?: string
  dutyholder_email?: string
  dutyholder_phone?: string
  principal_contractor?: string
}

export interface UpdateSiteInput extends Partial<CreateSiteInput> {
  id: string
}

export interface CreateAssessmentInput {
  site_id: string
  assessor_name?: string
  assessment_date?: string
  is_high_rise?: boolean
}

export interface CreateHazardInput {
  assessment_id: string
  location: string
  description: string
  hazard_type?: HazardType
  severity: RiskScore
  likelihood: RiskScore
  control_measures?: string
  photo_urls?: string[]
}

export interface UpdateHazardInput extends Partial<
  Omit<CreateHazardInput, 'assessment_id'>
> {
  id: string
  is_resolved?: boolean
}

export interface CreateActionInput {
  assessment_id: string
  hazard_id?: string
  action_description: string
  priority?: Priority
  assigned_to?: string
  assigned_role?: string
  target_date?: string
}

export interface UpdateActionInput extends Partial<
  Omit<CreateActionInput, 'assessment_id'>
> {
  id: string
  status?: ActionStatus
  completion_notes?: string
}

export interface CreateTenantInput {
  site_id: string
  apartment_number: string
  floor_number: number
  tenant_name: string
  has_mobility_issues?: boolean
  uses_wheelchair?: boolean
  has_visual_impairment?: boolean
  has_hearing_impairment?: boolean
  has_cognitive_impairment?: boolean
  requires_assistance_evacuation?: boolean
  other_disabilities?: string
  blood_type?: string
  allergies?: string
  medical_conditions?: string
  oxygen_dependent?: boolean
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  number_of_occupants?: number
}

export interface UpdateTenantInput extends Partial<
  Omit<CreateTenantInput, 'site_id'>
> {
  id: string
}

export interface CreateRegistrationTokenInput {
  site_id: string
  expires_in_days?: number // Default: 30
}

export interface ResidentRegistrationInput {
  token: string
  apartment_number: string
  floor_number: number
  tenant_name: string
  number_of_occupants: number
  // Disability information
  has_mobility_issues?: boolean
  uses_wheelchair?: boolean
  has_visual_impairment?: boolean
  has_hearing_impairment?: boolean
  has_cognitive_impairment?: boolean
  requires_assistance_evacuation?: boolean
  other_disabilities?: string
  // Medical information
  blood_type?: string
  allergies?: string
  medical_conditions?: string
  oxygen_dependent?: boolean
  // Emergency contact
  emergency_contact_name?: string
  emergency_contact_phone?: string

  notes?: string
  // Section 1: Site Information
  site_name?: string
  assessment_date?: string
  site_address?: string
  postcode?: string
  assessor_name?: string
  assessor_company?: string
  principal_contractor?: string
  dutyholder_name?: string
  dutyholder_contact?: string
  project_description?: string
  // Section 2: Building Details
  building_type?: string
  number_of_floors_site?: number
  building_height?: number
  occupancy_type?: string
  estimated_occupancy?: number
  vulnerable_occupants?: string
  // Section 3: Fire Safety Provisions
  fire_alarm_type?: string
  fire_alarm_working?: string
  emergency_lighting?: string
  fire_extinguishers?: string
  sprinkler_system?: string
  smoke_ventilation?: string
  // Section 4: Fire Doors & Compartmentation
  fire_doors_present?: string
  fire_doors_condition?: string
  self_closing_mechanism?: string
  // Section 5: Means of Escape
  escape_routes_adequate?: string
  escape_routes_clear?: string
  emergency_exits?: string
  assembly_point?: string
  evacuation_procedure?: string
  // Section 6: Hot Works & Construction Activities
  hot_works_permit_system?: string
  hot_works_training?: string
}

// ============================================
// UI State Types
// ============================================

export interface WizardState {
  currentSection: SectionNumber
  completedSections: SectionNumber[]
  isHighRise: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
}

export interface RiskMatrixCell {
  severity: RiskScore
  likelihood: RiskScore
  score: number
  level: RiskLevel
  count: number
}

export interface DashboardStats {
  totalSites: number
  totalAssessments: number
  draftAssessments: number
  completedAssessments: number
  criticalHazards: number
  pendingActions: number
  overdueActions: number
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// Constants
// ============================================

export const SECTION_NAMES: Record<SectionNumber, string> = {
  1: 'Site Information',
  2: 'Fire Doors',
  3: 'Hot Works',
  4: 'Escape Routes',
  5: 'Fire Detection',
  6: 'Emergency Procedures',
  7: 'Hazard Identification',
  8: 'Action Plan',
  9: 'Summary',
  10: 'Sign Off',
}

export const HAZARD_TYPES: Record<HazardType, string> = {
  fire_load: 'Fire Load',
  ignition_source: 'Ignition Source',
  means_of_escape: 'Means of Escape',
  fire_doors: 'Fire Doors',
  fire_detection: 'Fire Detection',
  emergency_lighting: 'Emergency Lighting',
  signage: 'Signage',
  hot_works: 'Hot Works',
  electrical: 'Electrical',
  storage: 'Storage',
  housekeeping: 'Housekeeping',
  other: 'Other',
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

export const RISK_LEVEL_BG_COLORS: Record<RiskLevel, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

export const HIGH_RISE_THRESHOLD_M = 18
