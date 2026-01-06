import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

// Force dynamic rendering for the entire dashboard route group
// Required because dashboard pages use React Query which doesn't work with static pre-rendering
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <div className="bg-background min-h-screen">
      <DashboardSidebar />
      {/* Main content */}
      <main className="pt-16 lg:pt-0 lg:pl-64">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
