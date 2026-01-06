'use client'

import { use } from 'react'
import Link from 'next/link'
import { useTenant } from '@/hooks/use-tenants'
import { TenantQRCode } from '@/components/tenant'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ArrowLeft,
  Pencil,
  Printer,
  Building,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QR_RISK_CLASSES, getTenantDisabilityFlags } from '@/utils/qr-generator'
import {
  TENANT_RISK_DESCRIPTIONS,
  TENANT_RISK_ACTIONS,
} from '@/utils/tenant-risk'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TenantDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { data: tenant, isLoading, error } = useTenant(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="container mx-auto py-12 text-center">
        <AlertTriangle className="text-destructive mx-auto mb-4 h-12 w-12" />
        <h1 className="text-xl font-bold">Tenant Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The tenant you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>
      </div>
    )
  }

  const riskClasses = QR_RISK_CLASSES[tenant.risk_level]
  const flags = getTenantDisabilityFlags(tenant)

  return (
    <div className="container mx-auto max-w-4xl py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tenants">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Apartment {tenant.apartment_number}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Building className="h-4 w-4" />
            {tenant.site?.name || 'Unknown Building'} • Floor{' '}
            {tenant.floor_number}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/tenants/${tenant.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/tenants/${tenant.id}/qr`}>
              <Printer className="mr-2 h-4 w-4" />
              Print QR
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>Door QR Code</CardTitle>
            <CardDescription>
              Scan this code for emergency tenant information
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <TenantQRCode
              tenant={tenant}
              size="lg"
              showInfo={false}
              showActions
            />
          </CardContent>
        </Card>

        {/* Tenant Info */}
        <div className="space-y-4">
          {/* Risk Level */}
          <Card className={cn('border-2', riskClasses.border)}>
            <CardHeader className={cn(riskClasses.bg)}>
              <div className="flex items-center gap-2">
                {(tenant.risk_level === 'critical' ||
                  tenant.risk_level === 'high') && (
                  <AlertTriangle className={cn('h-5 w-5', riskClasses.text)} />
                )}
                <CardTitle className={cn(riskClasses.text)}>
                  {tenant.risk_level.toUpperCase()} RISK
                </CardTitle>
              </div>
              <CardDescription className={riskClasses.text}>
                {TENANT_RISK_DESCRIPTIONS[tenant.risk_level]}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <h4 className="mb-2 text-sm font-medium">Recommended Actions:</h4>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                {TENANT_RISK_ACTIONS[tenant.risk_level].map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Tenant Details */}
          <Card>
            <CardHeader>
              <CardTitle>{tenant.tenant_name}</CardTitle>
              <CardDescription>
                {tenant.number_of_occupants} occupant
                {tenant.number_of_occupants !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Disability Flags */}
              {flags.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    Special Requirements:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {flags.map((flag) => (
                      <span
                        key={flag.key}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm',
                          flag.critical
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {flag.icon} {flag.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies */}
              {tenant.allergies && (
                <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <strong>⚠️ Allergies:</strong> {tenant.allergies}
                </div>
              )}

              {/* Medical Conditions */}
              {tenant.medical_conditions && (
                <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  <strong>🏥 Medical:</strong> {tenant.medical_conditions}
                </div>
              )}

              {/* Emergency Contact */}
              {tenant.emergency_contact_name && (
                <div>
                  <h4 className="mb-1 text-sm font-medium">
                    Emergency Contact:
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {tenant.emergency_contact_name}
                    {tenant.emergency_contact_phone && (
                      <>
                        {' '}
                        •{' '}
                        <a
                          href={`tel:${tenant.emergency_contact_phone}`}
                          className="text-primary hover:underline"
                        >
                          {tenant.emergency_contact_phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Notes */}
              {tenant.notes && (
                <div>
                  <h4 className="mb-1 text-sm font-medium">Notes:</h4>
                  <p className="text-muted-foreground text-sm">
                    {tenant.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
