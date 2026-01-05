'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  ClipboardCheck,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useAssessments, useDeleteAssessment } from '@/hooks/use-assessments'
import type { Assessment, AssessmentStatus } from '@/types'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<
  AssessmentStatus,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
> = {
  draft: {
    label: 'Draft',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  in_progress: {
    label: 'In Progress',
    icon: Edit,
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  },
  signed_off: {
    label: 'Signed Off',
    icon: CheckCircle2,
    color:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  },
}

function AssessmentRow({
  assessment,
  onDelete,
}: {
  assessment: Assessment
  onDelete: () => void
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const statusConfig = STATUS_CONFIG[assessment.status]
  const StatusIcon = statusConfig.icon

  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Assessment info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {assessment.assessment_number}
              </span>
              {assessment.is_high_rise && (
                <Badge
                  variant="outline"
                  className="border-orange-500 text-orange-500"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  High-Rise
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground truncate text-sm">
              {assessment.site?.name || 'Unknown Site'}
            </p>
          </div>

          {/* Date */}
          <div className="text-muted-foreground hidden text-sm md:block">
            {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
          </div>

          {/* Progress */}
          <div className="hidden text-sm sm:block">
            <span className="font-medium">{assessment.current_section}/10</span>
            <span className="text-muted-foreground ml-1">sections</span>
          </div>

          {/* Status */}
          <Badge className={statusConfig.color}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusConfig.label}
          </Badge>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/assessments/${assessment.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {assessment.status !== 'signed_off' && (
                <DropdownMenuItem asChild>
                  <Link href={`/assessments/${assessment.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Continue Assessment
                  </Link>
                </DropdownMenuItem>
              )}
              {assessment.pdf_url && (
                <DropdownMenuItem asChild>
                  <a
                    href={assessment.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete assessment &ldquo;
              {assessment.assessment_number}&rdquo; and all associated hazards
              and actions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function AssessmentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data: assessments, isLoading } = useAssessments()
  const deleteAssessment = useDeleteAssessment()

  const filteredAssessments = assessments?.filter((assessment) => {
    const matchesSearch =
      assessment.assessment_number
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      assessment.site?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || assessment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">
            Manage your fire risk assessments
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/assessments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="signed_off">Signed Off</SelectItem>
          </SelectContent>
        </Select>
        {filteredAssessments && (
          <span className="text-muted-foreground text-sm">
            {filteredAssessments.length} assessment
            {filteredAssessments.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Assessments List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="bg-muted h-12 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAssessments?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <ClipboardCheck className="text-muted-foreground/50 mb-4 h-16 w-16" />
          <h3 className="text-lg font-semibold">No assessments found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-center">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start your first fire risk assessment'}
          </p>
          {!search && statusFilter === 'all' && (
            <Button asChild className="mt-4">
              <Link href="/assessments/new">
                <Plus className="mr-2 h-4 w-4" />
                Start First Assessment
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAssessments?.map((assessment) => (
            <AssessmentRow
              key={assessment.id}
              assessment={assessment}
              onDelete={() => deleteAssessment.mutate(assessment.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
