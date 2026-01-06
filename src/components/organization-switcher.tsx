'use client'

import { useState } from 'react'
import { useOrganizationContext } from '@/providers/organization-context'
import {
  useCreateOrganization,
  type Organization,
} from '@/hooks/use-organization'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Check, ChevronDown, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrganizationSwitcherProps {
  className?: string
}

export function OrganizationSwitcher({ className }: OrganizationSwitcherProps) {
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    isPersonalMode,
    setPersonalMode,
  } = useOrganizationContext()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn('w-full justify-between', className)}
          >
            <div className="flex items-center gap-2 truncate">
              {isPersonalMode ? (
                <>
                  <User className="text-muted-foreground h-4 w-4" />
                  <span className="truncate">Personal</span>
                </>
              ) : currentOrganization ? (
                <>
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <span className="truncate">{currentOrganization.name}</span>
                </>
              ) : (
                <>
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">
                    Select organization
                  </span>
                </>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Personal mode option */}
          <DropdownMenuItem
            onClick={() => setPersonalMode(true)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Personal</span>
            </div>
            {isPersonalMode && <Check className="h-4 w-4" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Organization list */}
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => setCurrentOrganization(org)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{org.name}</span>
              </div>
              {currentOrganization?.id === org.id && !isPersonalMode && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}

          {organizations.length === 0 && (
            <div className="text-muted-foreground px-2 py-1.5 text-sm">
              No organizations yet
            </div>
          )}

          <DropdownMenuSeparator />

          {/* Create new organization */}
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(org) => {
          setCurrentOrganization(org)
          setCreateDialogOpen(false)
        }}
      />
    </>
  )
}

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (org: Organization) => void
}

function CreateOrganizationDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState('')
  const createOrg = useCreateOrganization()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const org = await createOrg.mutateAsync({ name: name.trim() })
      setName('')
      onCreated?.(org)
    } catch (error) {
      console.error('Failed to create organization:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to share sites and assessments with your
            team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="My Company"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createOrg.isPending}
            >
              {createOrg.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
