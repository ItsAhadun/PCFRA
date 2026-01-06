'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useSites } from '@/hooks/use-sites'
import { useTenant, useUpdateTenant } from '@/hooks/use-tenants'
import { TenantForm } from '@/components/tenant'
import { UpdateTenantInput, CreateTenantInput } from '@/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditTenantPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const { data: tenant, isLoading: tenantLoading } = useTenant(id)
  const { data: sites, isLoading: sitesLoading } = useSites()
  const updateTenant = useUpdateTenant()

  const handleSubmit = async (data: CreateTenantInput | UpdateTenantInput) => {
    await updateTenant.mutateAsync(data as UpdateTenantInput)
    router.push(`/tenants/${id}`)
  }

  if (tenantLoading || sitesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-xl font-bold">Tenant Not Found</h1>
        <Button className="mt-4" asChild>
          <Link href="/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href={`/tenants/${id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Edit Tenant - Apt {tenant.apartment_number}
        </h1>
        <p className="text-muted-foreground">
          Update tenant information and emergency details
        </p>
      </div>

      <TenantForm
        tenant={tenant}
        sites={sites || []}
        onSubmit={handleSubmit}
        isSubmitting={updateTenant.isPending}
      />
    </div>
  )
}
