'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Flame,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/sites', icon: Building2, label: 'Sites' },
  { href: '/assessments', icon: ClipboardCheck, label: 'Assessments' },
]

function UserAvatar() {
  const supabase = createClient()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user
    },
  })

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="hidden lg:block">
        <p className="max-w-[150px] truncate text-sm font-medium">
          {user?.email}
        </p>
      </div>
    </div>
  )
}

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile header */}
      <div className="bg-background fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          <span className="font-bold">PCFRA</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 border-b p-4">
                <Flame className="h-6 w-6 text-orange-500" />
                <span className="font-bold">PCFRA</span>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-auto p-4">
                <NavContent onItemClick={() => setOpen(false)} />
              </div>

              {/* Footer */}
              <div className="space-y-4 border-t p-4">
                <Suspense>
                  <UserAvatar />
                </Suspense>
                <div className="flex items-center justify-between">
                  <ThemeSwitcher />
                  <LogoutButton />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="bg-background fixed top-0 left-0 z-40 hidden h-screen w-64 border-r lg:block">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b p-6">
            <Flame className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-lg font-bold">PCFRA</h1>
              <p className="text-muted-foreground text-xs">
                Fire Risk Assessment
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto p-4">
            <NavContent />
          </div>

          {/* Footer */}
          <div className="space-y-4 border-t p-4">
            <Suspense>
              <UserAvatar />
            </Suspense>
            <div className="flex items-center justify-between">
              <ThemeSwitcher />
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
