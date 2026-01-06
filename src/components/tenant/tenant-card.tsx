'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tenant } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  QrCode,
  MoreVertical,
  Pencil,
  Trash2,
  Printer,
  User,
  Building,
  AlertTriangle,
} from 'lucide-react'
import { QR_RISK_CLASSES, getTenantDisabilityFlags } from '@/utils/qr-generator'

interface TenantCardProps {
  tenant: Tenant
  onDelete?: () => void
  showSiteInfo?: boolean
}

export function TenantCard({
  tenant,
  onDelete,
  showSiteInfo = false,
}: TenantCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const riskColors = QR_RISK_CLASSES[tenant.risk_level]
  const flags = getTenantDisabilityFlags(tenant)

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden border-l-4 transition-shadow hover:shadow-md',
          riskColors.border,
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold',
                  riskColors.bg,
                  riskColors.text,
                )}
              >
                {tenant.apartment_number}
              </div>
              <div>
                <CardTitle className="text-base">
                  {tenant.tenant_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  Floor {tenant.floor_number}
                  {tenant.number_of_occupants > 1 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <User className="h-3 w-3" />
                      {tenant.number_of_occupants} occupants
                    </>
                  )}
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/tenants/${tenant.id}`}>
                    <QrCode className="mr-2 h-4 w-4" />
                    View QR Code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/tenants/${tenant.id}/qr`}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print QR Code
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/tenants/${tenant.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Risk Level Badge */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              riskColors.bg,
              riskColors.text,
            )}
          >
            {tenant.risk_level === 'critical' && (
              <AlertTriangle className="h-3 w-3" />
            )}
            {tenant.risk_level.charAt(0).toUpperCase() +
              tenant.risk_level.slice(1)}{' '}
            Risk
          </div>

          {/* Disability Flags */}
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((flag) => (
                <span
                  key={flag.key}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs',
                    flag.critical
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-muted text-muted-foreground',
                  )}
                  title={flag.label}
                >
                  <span>{flag.icon}</span>
                  {flag.label}
                </span>
              ))}
            </div>
          )}

          {/* Allergies */}
          {tenant.allergies && (
            <div className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <strong>Allergies:</strong> {tenant.allergies}
            </div>
          )}

          {/* Site Info */}
          {showSiteInfo && tenant.site && (
            <div className="text-muted-foreground text-xs">
              <Building className="mr-1 inline h-3 w-3" />
              {tenant.site.name}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {tenant.tenant_name} from apartment{' '}
              {tenant.apartment_number}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
