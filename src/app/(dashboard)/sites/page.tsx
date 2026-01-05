'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Building2,
  MapPin,
  Ruler,
  MoreHorizontal,
  Edit,
  Trash2,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useSites, useDeleteSite } from '@/hooks/use-sites'
import type { Site } from '@/types'
import { HIGH_RISE_THRESHOLD_M } from '@/types'

function SiteCard({ site, onDelete }: { site: Site; onDelete: () => void }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const isHighRise = (site.building_height_m || 0) > HIGH_RISE_THRESHOLD_M

  return (
    <>
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
        {isHighRise && (
          <div className="absolute top-0 right-0 left-0 bg-orange-500 px-3 py-1 text-xs font-medium text-white">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            High-Rise Building (18m+)
          </div>
        )}
        <CardHeader className={isHighRise ? 'pt-10' : ''}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="text-muted-foreground h-5 w-5" />
                {site.name}
              </CardTitle>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" />
                {site.address}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/sites/${site.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/assessments/new?site=${site.id}`}>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    New Assessment
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Site
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {site.building_height_m && (
              <div>
                <p className="text-muted-foreground">Height</p>
                <p className="font-medium">{site.building_height_m}m</p>
              </div>
            )}
            {site.number_of_floors && (
              <div>
                <p className="text-muted-foreground">Floors</p>
                <p className="font-medium">{site.number_of_floors}</p>
              </div>
            )}
            {site.building_use && (
              <div>
                <p className="text-muted-foreground">Use</p>
                <p className="font-medium">{site.building_use}</p>
              </div>
            )}
            {site.construction_phase && (
              <div>
                <p className="text-muted-foreground">Phase</p>
                <p className="font-medium">{site.construction_phase}</p>
              </div>
            )}
          </div>

          {site.principal_contractor && (
            <div className="mt-4 border-t pt-4">
              <p className="text-muted-foreground text-xs">
                Principal Contractor
              </p>
              <p className="text-sm font-medium">{site.principal_contractor}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button asChild className="flex-1" size="sm">
              <Link href={`/sites/${site.id}`}>View Details</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/assessments/new?site=${site.id}`}>
                <ClipboardCheck className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{site.name}&rdquo; and ALL
              associated assessments, hazards, and actions. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Site
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SitesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted h-12 animate-pulse rounded" />
              <div className="bg-muted h-12 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function SitesPage() {
  const [search, setSearch] = useState('')
  const { data: sites, isLoading } = useSites()
  const deleteSite = useDeleteSite()

  const filteredSites = sites?.filter(
    (site) =>
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.address.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">
            Manage your construction sites
          </p>
        </div>
        <Button asChild>
          <Link href="/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search sites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {filteredSites && (
          <span className="text-muted-foreground text-sm">
            {filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Sites Grid */}
      {isLoading ? (
        <SitesSkeleton />
      ) : filteredSites?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Building2 className="text-muted-foreground/50 mb-4 h-16 w-16" />
          <h3 className="text-lg font-semibold">No sites found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-center">
            {search
              ? 'Try adjusting your search terms'
              : 'Add your first construction site to get started'}
          </p>
          {!search && (
            <Button asChild className="mt-4">
              <Link href="/sites/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Site
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSites?.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onDelete={() => deleteSite.mutate(site.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
