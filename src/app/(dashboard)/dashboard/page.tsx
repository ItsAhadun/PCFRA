'use client'

import Link from 'next/link'
import {
  Building2,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  Plus,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { useSites } from '@/hooks/use-sites'
import { useAssessments } from '@/hooks/use-assessments'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="text-muted-foreground h-5 w-5" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function RecentAssessments() {
  const { data: assessments, isLoading } = useAssessments()
  const recent = assessments?.slice(0, 5)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (!recent?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ClipboardCheck className="text-muted-foreground/50 mb-3 h-12 w-12" />
        <p className="text-muted-foreground">No assessments yet</p>
        <Button asChild className="mt-4">
          <Link href="/assessments/new">
            <Plus className="mr-2 h-4 w-4" />
            Start First Assessment
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recent.map((assessment) => (
        <Link
          key={assessment.id}
          href={`/assessments/${assessment.id}`}
          className="hover:bg-muted flex items-center justify-between rounded-lg border p-4 transition-colors"
        >
          <div>
            <p className="font-medium">{assessment.assessment_number}</p>
            <p className="text-muted-foreground text-sm">
              {assessment.site?.name || 'Unknown Site'}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                assessment.status === 'signed_off'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : assessment.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {assessment.status === 'signed_off' && (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}
              {assessment.status.replace('_', ' ')}
            </span>
            <p className="text-muted-foreground mt-1 text-xs">
              {new Date(assessment.created_at).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { data: sites, isLoading: sitesLoading } = useSites()
  const { data: assessments, isLoading: assessmentsLoading } = useAssessments()

  const completedCount =
    assessments?.filter((a) => a.status === 'signed_off').length || 0
  const draftCount =
    assessments?.filter(
      (a) => a.status === 'draft' || a.status === 'in_progress',
    ).length || 0
  // Count critical hazards from assessments
  const criticalHazards =
    assessments?.reduce((count, a) => {
      return (
        count +
        (a.hazards?.filter((h) => h.risk_level === 'critical' && !h.is_resolved)
          .length || 0)
      )
    }, 0) || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your fire risk assessments
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/assessments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sites"
          value={sites?.length || 0}
          icon={Building2}
          loading={sitesLoading}
        />
        <StatCard
          title="Completed Assessments"
          value={completedCount}
          icon={CheckCircle2}
          loading={assessmentsLoading}
        />
        <StatCard
          title="In Progress"
          value={draftCount}
          icon={Clock}
          loading={assessmentsLoading}
        />
        <StatCard
          title="Critical Hazards"
          value={criticalHazards}
          description={
            criticalHazards > 0 ? 'Require immediate action' : 'All clear'
          }
          icon={AlertTriangle}
          loading={assessmentsLoading}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Assessments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>
                Your latest fire risk assessments
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/assessments">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentAssessments />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/assessments/new">
                <ClipboardCheck className="mr-3 h-4 w-4" />
                Start New Assessment
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/sites/new">
                <Building2 className="mr-3 h-4 w-4" />
                Add New Site
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/assessments?status=in_progress">
                <Clock className="mr-3 h-4 w-4" />
                Continue Draft Assessment
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Notice */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-orange-800 dark:text-orange-200">
              Building Safety Act 2022 Compliance
            </h3>
            <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
              This tool is designed to help meet the Golden Thread requirements
              for fire risk assessments on construction sites. Ensure all
              high-rise buildings (18m+) have appropriate documentation and
              review schedules.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
