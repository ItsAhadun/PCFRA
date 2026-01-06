'use client'

import { use, useEffect } from 'react'
import { useTenant } from '@/hooks/use-tenants'
import { cn } from '@/lib/utils'
import { TenantQRCode } from '@/components/tenant'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import {
  QR_RISK_COLORS,
  getTenantDisabilityFlags,
  RISK_LEVEL_TEXT,
} from '@/utils/qr-generator'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TenantQRPrintPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: tenant, isLoading } = useTenant(id)

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg">Tenant not found</p>
        <Button asChild>
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>
      </div>
    )
  }

  const riskColors = QR_RISK_COLORS[tenant.risk_level]
  const flags = getTenantDisabilityFlags(tenant)

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen p-4">
        {/* Controls - hidden on print */}
        <div className="no-print mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/tenants/${tenant.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenant
            </Link>
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print QR Code
          </Button>
        </div>

        {/* Print Area */}
        <div className="print-area mx-auto max-w-md">
          {/* Door Card */}
          <div
            className="overflow-hidden rounded-2xl border-4"
            style={{
              borderColor: riskColors.border,
              backgroundColor: riskColors.bg,
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 text-center text-white"
              style={{ backgroundColor: riskColors.border }}
            >
              <div className="text-4xl font-bold">
                APT {tenant.apartment_number}
              </div>
              <div className="text-lg opacity-90">
                Floor {tenant.floor_number}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center bg-white p-6">
              <TenantQRCode tenant={tenant} size="print" showInfo={false} />
            </div>

            {/* Risk Level */}
            <div
              className="px-6 py-3 text-center font-bold"
              style={{ backgroundColor: riskColors.border, color: 'white' }}
            >
              {tenant.risk_level.toUpperCase()} RISK
            </div>

            {/* Info Section */}
            <div className="space-y-3 p-4">
              {/* Emergency Flags */}
              {flags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {flags.slice(0, 4).map((flag) => (
                    <span
                      key={flag.key}
                      className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium"
                      style={{ color: riskColors.text }}
                    >
                      {flag.icon} {flag.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Occupants */}
              <div
                className="text-center text-sm"
                style={{ color: riskColors.text }}
              >
                {tenant.number_of_occupants} occupant
                {tenant.number_of_occupants !== 1 ? 's' : ''}
              </div>

              {/* Emergency Instructions */}
              <div
                className="rounded-lg bg-white/50 p-3 text-center text-xs"
                style={{ color: riskColors.text }}
              >
                <strong>SCAN QR FOR EMERGENCY INFO</strong>
                <p className="mt-1 opacity-80">
                  {RISK_LEVEL_TEXT[tenant.risk_level]}
                </p>
              </div>
            </div>
          </div>

          {/* Print Guide Lines (visible only when printing) */}
          <div className="mt-2 border-t-2 border-dashed border-gray-300" />
          <p className="mt-1 text-center text-xs text-gray-400">
            ✂️ Cut along dotted line • Mount at eye level on apartment door
          </p>
        </div>
      </div>
    </>
  )
}
