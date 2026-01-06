'use client'

import { useEffect, useRef } from 'react'
import { Tenant } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Printer, Download, AlertTriangle, User, Building } from 'lucide-react'
import {
  QR_RISK_COLORS,
  QR_RISK_CLASSES,
  generateTenantQRUrl,
  getTenantDisabilityFlags,
  RISK_LEVEL_TEXT,
} from '@/utils/qr-generator'
import QRCode from 'qrcode'

interface TenantQRCodeProps {
  tenant: Tenant | Partial<Tenant>
  size?: 'sm' | 'md' | 'lg' | 'print'
  showInfo?: boolean
  showActions?: boolean
  className?: string
}

const SIZE_MAP = {
  sm: 150,
  md: 200,
  lg: 300,
  print: 400,
}

export function TenantQRCode({
  tenant,
  size = 'md',
  showInfo = true,
  showActions = false,
  className,
}: TenantQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const riskLevel = tenant.risk_level || 'low'
  const riskColors = QR_RISK_COLORS[riskLevel]
  const riskClasses = QR_RISK_CLASSES[riskLevel]
  const flags = getTenantDisabilityFlags(tenant)
  const qrSize = SIZE_MAP[size]

  useEffect(() => {
    if (!canvasRef.current || !tenant.id) return

    const url = generateTenantQRUrl(tenant.id)

    QRCode.toCanvas(canvasRef.current, url, {
      width: qrSize,
      margin: 2,
      color: {
        dark: '#000000',
        light: riskColors.bg,
      },
    })
  }, [tenant.id, qrSize, riskColors.bg])

  const handlePrint = () => {
    window.open(`/tenants/${tenant.id}/qr`, '_blank')
  }

  const handleDownload = async () => {
    if (!canvasRef.current || !tenant.id) return

    const url = generateTenantQRUrl(tenant.id)
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: riskColors.bg,
      },
    })

    const link = document.createElement('a')
    link.download = `qr-apt-${tenant.apartment_number}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* QR Code Container with colored border */}
      <div
        className={cn(
          'rounded-xl border-4 p-4',
          riskClasses.border,
          riskClasses.bg,
        )}
      >
        {/* Apartment Header */}
        <div className={cn('mb-3 text-center', riskClasses.text)}>
          <div className="text-3xl font-bold">
            APT {tenant.apartment_number}
          </div>
          <div className="text-sm">Floor {tenant.floor_number}</div>
        </div>

        {/* QR Code */}
        <div className="rounded-lg bg-white p-2">
          <canvas ref={canvasRef} />
        </div>

        {/* Risk Level */}
        <div
          className={cn(
            'mt-3 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-center font-medium',
            riskLevel === 'critical' && 'bg-red-500 text-white',
            riskLevel === 'high' && 'bg-orange-500 text-white',
            riskLevel === 'medium' && 'bg-yellow-500 text-yellow-900',
            riskLevel === 'low' && 'bg-green-500 text-white',
          )}
        >
          {(riskLevel === 'critical' || riskLevel === 'high') && (
            <AlertTriangle className="h-4 w-4" />
          )}
          {riskLevel.toUpperCase()} RISK
        </div>
      </div>

      {/* Info Section */}
      {showInfo && (
        <div className="mt-4 w-full max-w-sm space-y-3 text-sm">
          {/* Tenant Name */}
          {tenant.tenant_name && (
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">{tenant.tenant_name}</span>
              {tenant.number_of_occupants && tenant.number_of_occupants > 1 && (
                <span className="text-muted-foreground">
                  ({tenant.number_of_occupants} occupants)
                </span>
              )}
            </div>
          )}

          {/* Disability Flags */}
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((flag) => (
                <span
                  key={flag.key}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                    flag.critical
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <span>{flag.icon}</span>
                  {flag.label}
                </span>
              ))}
            </div>
          )}

          {/* Allergies */}
          {tenant.allergies && (
            <div className="rounded-md bg-amber-100 px-3 py-2 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <strong>⚠️ Allergies:</strong> {tenant.allergies}
            </div>
          )}

          {/* Medical Conditions */}
          {tenant.medical_conditions && (
            <div className="rounded-md bg-blue-100 px-3 py-2 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <strong>🏥 Medical:</strong> {tenant.medical_conditions}
            </div>
          )}

          {/* Emergency Contact */}
          {tenant.emergency_contact_name && (
            <div className="text-muted-foreground">
              <strong>Emergency Contact:</strong>{' '}
              {tenant.emergency_contact_name}
              {tenant.emergency_contact_phone && (
                <span> - {tenant.emergency_contact_phone}</span>
              )}
            </div>
          )}

          {/* Risk Description */}
          <p className={cn('text-xs', riskClasses.text)}>
            {RISK_LEVEL_TEXT[riskLevel]}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      )}
    </div>
  )
}
