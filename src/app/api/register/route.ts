import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import {
  checkRateLimit,
  getRateLimitHeaders,
  rateLimiters,
} from '@/utils/rate-limit'
import { sanitizeFormData, sanitizeUuid } from '@/utils/sanitize'
import type { ResidentRegistrationInput } from '@/types'

/**
 * Protected registration endpoint with rate limiting.
 * This endpoint is called when tenants self-register via QR code.
 */
export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Check rate limit
  const rateLimitResult = checkRateLimit(ip, rateLimiters.registration)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      },
    )
  }

  try {
    // Parse and sanitize request body
    const rawBody = await request.json()
    const body = sanitizeFormData(rawBody) as ResidentRegistrationInput

    // Validate required fields
    if (!body.token) {
      return NextResponse.json(
        { error: 'Registration token is required' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) },
      )
    }

    if (!body.apartment_number) {
      return NextResponse.json(
        { error: 'Apartment number is required' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) },
      )
    }

    if (!body.tenant_name) {
      return NextResponse.json(
        { error: 'Tenant name is required' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) },
      )
    }

    const supabase = await createClient()

    // Validate the registration token
    const { data: tokenData, error: tokenError } = await supabase
      .from('registration_tokens')
      .select('*, site:sites(*)')
      .eq('token', body.token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired registration link' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) },
      )
    }

    // Create the tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        site_id: tokenData.site_id,
        user_id: tokenData.created_by,
        apartment_number: body.apartment_number,
        floor_number: body.floor_number || 1,
        tenant_name: body.tenant_name,
        number_of_occupants: body.number_of_occupants || 1,
        has_mobility_issues: body.has_mobility_issues || false,
        uses_wheelchair: body.uses_wheelchair || false,
        has_visual_impairment: body.has_visual_impairment || false,
        has_hearing_impairment: body.has_hearing_impairment || false,
        has_cognitive_impairment: body.has_cognitive_impairment || false,
        requires_assistance_evacuation:
          body.requires_assistance_evacuation || false,
        other_disabilities: body.other_disabilities || null,
        blood_type: body.blood_type || null,
        allergies: body.allergies || null,
        medical_conditions: body.medical_conditions || null,
        oxygen_dependent: body.oxygen_dependent || false,
        emergency_contact_name: body.emergency_contact_name || null,
        emergency_contact_phone: body.emergency_contact_phone || null,
        notes: body.notes || null,
      })
      .select('*')
      .single()

    if (tenantError) {
      console.error('Tenant creation error:', tenantError)

      // Check for duplicate apartment number
      if (tenantError.code === '23505') {
        return NextResponse.json(
          { error: 'This apartment is already registered' },
          { status: 409, headers: getRateLimitHeaders(rateLimitResult) },
        )
      }

      return NextResponse.json(
        { error: 'Failed to create registration. Please try again.' },
        { status: 500, headers: getRateLimitHeaders(rateLimitResult) },
      )
    }

    return NextResponse.json(
      { success: true, tenant },
      { status: 201, headers: getRateLimitHeaders(rateLimitResult) },
    )
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500, headers: getRateLimitHeaders(rateLimitResult) },
    )
  }
}
