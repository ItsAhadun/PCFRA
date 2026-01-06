'use client'

import { use } from 'react'
import { useTenantPublic } from '@/hooks/use-tenants'
import { cn } from '@/lib/utils'
import {
  QR_RISK_CLASSES,
  getTenantDisabilityFlags,
  RISK_LEVEL_TEXT,
} from '@/utils/qr-generator'
import { Loader2, AlertTriangle, Phone, User, Building } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Public page for first responders to view tenant emergency info
 * No authentication required - accessible by scanning QR code
 */
export default function PublicTenantPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: tenant, isLoading, error } = useTenantPublic(id)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-600">Loading tenant information...</p>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500" />
          <h1 className="mt-4 text-2xl font-bold">Tenant Not Found</h1>
          <p className="mt-2 text-gray-600">
            This QR code may be outdated or invalid.
          </p>
        </div>
      </div>
    )
  }

  const riskLevel = tenant.risk_level || 'low'
  const riskClasses = QR_RISK_CLASSES[riskLevel]
  const flags = getTenantDisabilityFlags(tenant)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Risk Level */}
      <div
        className={cn(
          'px-4 py-6 text-center text-white',
          riskLevel === 'critical' && 'bg-red-600',
          riskLevel === 'high' && 'bg-orange-500',
          riskLevel === 'medium' && 'bg-yellow-500 text-yellow-900',
          riskLevel === 'low' && 'bg-green-600',
        )}
      >
        <div className="flex items-center justify-center gap-2">
          {(riskLevel === 'critical' || riskLevel === 'high') && (
            <AlertTriangle className="h-8 w-8" />
          )}
          <span className="text-3xl font-bold">
            {riskLevel.toUpperCase()} RISK
          </span>
        </div>
        <p className="mt-2 text-lg opacity-90">{RISK_LEVEL_TEXT[riskLevel]}</p>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Apartment Info */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-gray-500">
                <Building className="h-4 w-4" />
                <span>APARTMENT</span>
              </div>
              <div className="text-4xl font-bold">
                {tenant.apartment_number}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-500">FLOOR</div>
              <div className="text-4xl font-bold">{tenant.floor_number}</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-medium">{tenant.tenant_name}</span>
            </div>
            {tenant.number_of_occupants && tenant.number_of_occupants > 1 && (
              <p className="ml-7 text-gray-500">
                {tenant.number_of_occupants} occupants
              </p>
            )}
          </div>
        </div>

        {/* Special Requirements */}
        {flags.length > 0 && (
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <h2 className="mb-3 font-semibold text-gray-700">
              ⚠️ Special Requirements
            </h2>
            <div className="space-y-2">
              {flags.map((flag) => (
                <div
                  key={flag.key}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3',
                    flag.critical
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-700',
                  )}
                >
                  <span className="text-2xl">{flag.icon}</span>
                  <span className="font-medium">{flag.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medical Info */}
        {(tenant.allergies ||
          tenant.medical_conditions ||
          tenant.oxygen_dependent) && (
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <h2 className="mb-3 font-semibold text-gray-700">
              🏥 Medical Info
            </h2>

            {tenant.oxygen_dependent && (
              <div className="mb-3 rounded-lg bg-red-100 px-4 py-3 text-red-800">
                <strong>🫁 OXYGEN DEPENDENT</strong>
              </div>
            )}

            {tenant.allergies && (
              <div className="mb-3 rounded-lg bg-amber-100 px-4 py-3 text-amber-800">
                <strong>Allergies:</strong>
                <p className="mt-1">{tenant.allergies}</p>
              </div>
            )}

            {tenant.medical_conditions && (
              <div className="rounded-lg bg-blue-100 px-4 py-3 text-blue-800">
                <strong>Conditions:</strong>
                <p className="mt-1">{tenant.medical_conditions}</p>
              </div>
            )}
          </div>
        )}

        {/* Emergency Contact */}
        {tenant.emergency_contact_name && (
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <h2 className="mb-3 font-semibold text-gray-700">
              📞 Emergency Contact
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{tenant.emergency_contact_name}</p>
                {tenant.emergency_contact_phone && (
                  <p className="text-gray-500">
                    {tenant.emergency_contact_phone}
                  </p>
                )}
              </div>
              {tenant.emergency_contact_phone && (
                <a
                  href={`tel:${tenant.emergency_contact_phone}`}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
                >
                  <Phone className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-4 text-center text-xs text-gray-400">
          PCFRA Emergency Information System
        </div>
      </div>
    </div>
  )
}
