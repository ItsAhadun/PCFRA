'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSites } from '@/hooks/use-sites'
import {
  useTenants,
  useTenantRiskStats,
  useDeleteTenant,
} from '@/hooks/use-tenants'
import {
  TenantCard,
  GenerateRegistrationLink,
  PendingRegistrations,
} from '@/components/tenant'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Building, Users, AlertTriangle, Loader2 } from 'lucide-react'

export default function TenantsPage() {
  const { data: sites, isLoading: sitesLoading } = useSites()
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')

  const { data: tenants, isLoading: tenantsLoading } = useTenants(
    selectedSiteId || undefined,
  )
  const { data: riskStats } = useTenantRiskStats(selectedSiteId || undefined)
  const deleteTenant = useDeleteTenant()

  const handleDelete = (tenantId: string) => {
    if (!selectedSiteId) return
    deleteTenant.mutate({ id: tenantId, siteId: selectedSiteId })
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tenants
          </h1>
          <p className="text-muted-foreground">
            Manage apartment tenants and generate QR codes for doors
          </p>
        </div>
      </div>

      {/* Site Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Building</CardTitle>
          <CardDescription>
            Choose a building to view and manage its tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a building..." />
              </SelectTrigger>
              <SelectContent>
                {sitesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading sites...
                  </SelectItem>
                ) : sites?.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No sites available
                  </SelectItem>
                ) : (
                  sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {site.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button variant="outline" asChild>
              <Link href="/sites/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Building
              </Link>
            </Button>
            {selectedSiteId && sites && (
              <GenerateRegistrationLink
                site={sites.find((s) => s.id === selectedSiteId)!}
              />
            )}
          </div>
          {/* Pending Registrations */}
          {selectedSiteId && (
            <div className="mt-4 border-t pt-4">
              <PendingRegistrations siteId={selectedSiteId} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Stats */}
      {selectedSiteId && riskStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="text-muted-foreground h-5 w-5" />
                <span className="text-2xl font-bold">{riskStats.total}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-red-700 dark:text-red-300">
                Critical Risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {riskStats.critical}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-orange-700 dark:text-orange-300">
                High Risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {riskStats.high}
              </span>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Medium Risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {riskStats.medium}
              </span>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-700 dark:text-green-300">
                Low Risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                {riskStats.low}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tenants Grid */}
      {!selectedSiteId ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <Building className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">Select a Building</h3>
          <p className="text-muted-foreground mt-1">
            Choose a building from the dropdown above to view its tenants
          </p>
        </div>
      ) : tenantsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : tenants?.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <Users className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">No Tenants Yet</h3>
          <p className="text-muted-foreground mt-1">
            Add your first tenant to generate QR codes for apartment doors
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants?.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onDelete={() => handleDelete(tenant.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
