'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Building2,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  ClipboardCheck,
  AlertTriangle,
  X,
  Phone,
  Mail,
  User,
  Search,
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

function SiteDetailPanel({
  site,
  onClose,
  onDelete,
}: {
  site: Site
  onClose: () => void
  onDelete: () => void
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const isHighRise = (site.building_height_m || 0) > HIGH_RISE_THRESHOLD_M

  return (
    <>
      <Card className="border-primary/20 border-2">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="text-primary h-5 w-5" />
                <CardTitle>{site.name}</CardTitle>
                {isHighRise && (
                  <Badge
                    variant="outline"
                    className="border-orange-500 text-orange-500"
                  >
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    High-Rise
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" />
                {site.address}
                {site.postcode && `, ${site.postcode}`}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Building Details */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Building Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Height</p>
                <p className="font-medium">
                  {site.building_height_m ? `${site.building_height_m}m` : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Floors</p>
                <p className="font-medium">{site.number_of_floors || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Use</p>
                <p className="font-medium">{site.building_use || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phase</p>
                <p className="font-medium">{site.construction_phase || '—'}</p>
              </div>
            </div>
          </div>

          {/* Contractor & Dutyholder */}
          {(site.principal_contractor ||
            site.dutyholder_name ||
            site.dutyholder_email ||
            site.dutyholder_phone) && (
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-medium">Contacts</h4>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                {site.principal_contractor && (
                  <div>
                    <p className="text-muted-foreground">
                      Principal Contractor
                    </p>
                    <p className="font-medium">{site.principal_contractor}</p>
                  </div>
                )}
                {site.dutyholder_name && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Dutyholder
                    </p>
                    <p className="font-medium">{site.dutyholder_name}</p>
                    {site.dutyholder_email && (
                      <p className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" /> {site.dutyholder_email}
                      </p>
                    )}
                    {site.dutyholder_phone && (
                      <p className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3" /> {site.dutyholder_phone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* High-Rise Warning */}
          {isHighRise && (
            <div className="rounded-lg border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                ⚠️ High-Rise Building Requirements Apply
              </p>
              <p className="mt-1 text-xs text-orange-700 dark:text-orange-300">
                Building Safety Act 2022 requires enhanced documentation, fire
                safety assessments, and regular safety case reviews.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href={`/assessments/new?site=${site.id}`}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                New Assessment
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
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
              onClick={() => {
                onDelete()
                setDeleteDialogOpen(false)
              }}
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

function SiteListItem({
  site,
  isSelected,
  onSelect,
}: {
  site: Site
  isSelected: boolean
  onSelect: () => void
}) {
  const isHighRise = (site.building_height_m || 0) > HIGH_RISE_THRESHOLD_M

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition-all hover:shadow-md ${
        isSelected
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="truncate font-medium">{site.name}</span>
          </div>
          <p className="text-muted-foreground mt-1 truncate text-sm">
            {site.address}
          </p>
        </div>
        {isHighRise && (
          <Badge
            variant="outline"
            className="shrink-0 border-orange-500 text-orange-500"
          >
            <AlertTriangle className="h-3 w-3" />
          </Badge>
        )}
      </div>
      {(site.building_use || site.construction_phase) && (
        <div className="text-muted-foreground mt-2 flex gap-3 text-xs">
          {site.building_use && <span>{site.building_use}</span>}
          {site.construction_phase && <span>• {site.construction_phase}</span>}
        </div>
      )}
    </button>
  )
}

function SitesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

export default function SitesPage() {
  const [search, setSearch] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const { data: sites, isLoading } = useSites()
  const deleteSite = useDeleteSite()

  const filteredSites = sites?.filter(
    (site) =>
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.address.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedSite = sites?.find((s) => s.id === selectedSiteId)

  const handleDelete = (siteId: string) => {
    deleteSite.mutate(siteId)
    if (selectedSiteId === siteId) {
      setSelectedSiteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">
            Manage your construction sites
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/sites/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Site List */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredSites && (
            <p className="text-muted-foreground text-sm">
              {filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''}
              {selectedSite && ' • Click a site to view details'}
            </p>
          )}

          {/* Sites List */}
          {isLoading ? (
            <SitesSkeleton />
          ) : filteredSites?.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12">
              <Building2 className="text-muted-foreground/50 mb-4 h-12 w-12" />
              <h3 className="font-semibold">No sites found</h3>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                {search
                  ? 'Try adjusting your search terms'
                  : 'Add your first construction site'}
              </p>
              {!search && (
                <Button asChild className="mt-4" size="sm">
                  <Link href="/sites/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Site
                  </Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredSites?.map((site) => (
                <SiteListItem
                  key={site.id}
                  site={site}
                  isSelected={site.id === selectedSiteId}
                  onSelect={() => setSelectedSiteId(site.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Site Detail Panel */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {selectedSite ? (
            <SiteDetailPanel
              site={selectedSite}
              onClose={() => setSelectedSiteId(null)}
              onDelete={() => handleDelete(selectedSite.id)}
            />
          ) : (
            <Card className="flex flex-col items-center justify-center py-16">
              <Building2 className="text-muted-foreground/30 mb-4 h-16 w-16" />
              <h3 className="text-muted-foreground font-medium">
                Select a site to view details
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Click on any site from the list
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
