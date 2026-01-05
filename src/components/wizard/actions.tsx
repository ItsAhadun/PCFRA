'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Check, Plus, ClipboardList } from 'lucide-react'
import {
  useActions,
  useCreateAction,
  useDeleteAction,
  useUpdateAction,
} from '@/hooks/use-actions'
import { useHazards } from '@/hooks/use-hazards'
import { ActionItem, ActionStats } from '@/components/assessment/action-item'
import type { SectionData, CreateActionInput, Priority } from '@/types'

interface ActionsSectionProps {
  assessmentId: string
  data: SectionData
  onSave: (data: SectionData, isCompleted?: boolean) => void
  onNext: () => void
  isHighRise: boolean
  isSaving: boolean
}

export function ActionsSection({
  assessmentId,
  data,
  onSave,
  onNext,
  isSaving,
}: ActionsSectionProps) {
  const { data: actions = [], isLoading } = useActions(assessmentId)
  const { data: hazards = [] } = useHazards(assessmentId)
  const createAction = useCreateAction()
  const deleteAction = useDeleteAction()
  const updateAction = useUpdateAction()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [newAction, setNewAction] = useState<Partial<CreateActionInput>>({
    priority: 'medium',
  })

  const criticalHazards = hazards.filter(
    (h) => h.risk_level === 'critical' && !h.is_resolved,
  )
  const actionsForCritical = actions.filter((a) =>
    criticalHazards.some((h) => h.id === a.hazard_id),
  )

  const stats = {
    pending: actions.filter(
      (a) => a.status === 'pending' || a.status === 'in_progress',
    ).length,
    overdue: actions.filter((a) => {
      if (a.status === 'completed') return false
      if (!a.target_date) return false
      return new Date(a.target_date) < new Date()
    }).length,
    completed: actions.filter((a) => a.status === 'completed').length,
  }

  const handleCreateAction = async () => {
    if (!newAction.action_description) return

    await createAction.mutateAsync({
      assessment_id: assessmentId,
      action_description: newAction.action_description,
      hazard_id: newAction.hazard_id,
      priority: newAction.priority || 'medium',
      assigned_to: newAction.assigned_to,
      assigned_role: newAction.assigned_role,
      target_date: newAction.target_date,
    })

    setNewAction({ priority: 'medium' })
    setDialogOpen(false)
  }

  const handleStatusChange = async (actionId: string, completed: boolean) => {
    await updateAction.mutateAsync({
      id: actionId,
      status: completed ? 'completed' : 'pending',
    })
  }

  const handleSave = (complete: boolean = false) => {
    onSave(data, complete)
    if (complete) onNext()
  }

  const allCriticalHaveActions = criticalHazards.every((h) =>
    actions.some((a) => a.hazard_id === h.id),
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <ClipboardList className="h-5 w-5" />
          Section 8: Action Plan
        </h2>
        <p className="text-muted-foreground">
          Assign actions to address identified hazards
        </p>
      </div>

      {/* Critical hazard warning */}
      {criticalHazards.length > 0 && !allCriticalHaveActions && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            ⚠️ Critical hazards require assigned actions
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {criticalHazards.length - actionsForCritical.length} critical
            hazard(s) still need actions assigned before the assessment can be
            completed.
          </p>
        </div>
      )}

      {/* Stats */}
      <ActionStats {...stats} />

      {/* Add Action Button */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {actions.length} action{actions.length !== 1 ? 's' : ''} assigned
        </span>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Action
        </Button>
      </div>

      {/* Actions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : actions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <ClipboardList className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground">No actions assigned yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add actions to address identified hazards
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Action
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <ActionItem
              key={action.id}
              action={action}
              onStatusChange={(completed) =>
                handleStatusChange(action.id, completed)
              }
              onDelete={() =>
                deleteAction.mutate({
                  id: action.id,
                  assessmentId,
                  hazardId: action.hazard_id,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Add Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Action</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Link to hazard */}
            {hazards.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="hazard">Link to Hazard (Optional)</Label>
                <Select
                  value={newAction.hazard_id || ''}
                  onValueChange={(value) =>
                    setNewAction((prev) => ({
                      ...prev,
                      hazard_id: value || undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hazard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No linked hazard</SelectItem>
                    {hazards.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.location} - {h.description.slice(0, 40)}...
                        <span
                          className={`ml-2 text-xs ${h.risk_level === 'critical' ? 'text-red-500' : ''}`}
                        >
                          (Risk: {h.risk_score})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Action Description *</Label>
              <Textarea
                id="description"
                value={newAction.action_description || ''}
                onChange={(e) =>
                  setNewAction((prev) => ({
                    ...prev,
                    action_description: e.target.value,
                  }))
                }
                placeholder="Describe the action to be taken..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newAction.priority || 'medium'}
                onValueChange={(value) =>
                  setNewAction((prev) => ({
                    ...prev,
                    priority: value as Priority,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical - Immediate</SelectItem>
                  <SelectItem value="high">High - Within 24 hours</SelectItem>
                  <SelectItem value="medium">Medium - Within 1 week</SelectItem>
                  <SelectItem value="low">Low - Within 1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Input
                  id="assigned_to"
                  value={newAction.assigned_to || ''}
                  onChange={(e) =>
                    setNewAction((prev) => ({
                      ...prev,
                      assigned_to: e.target.value,
                    }))
                  }
                  placeholder="Person name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_role">Role</Label>
                <Input
                  id="assigned_role"
                  value={newAction.assigned_role || ''}
                  onChange={(e) =>
                    setNewAction((prev) => ({
                      ...prev,
                      assigned_role: e.target.value,
                    }))
                  }
                  placeholder="e.g., Site Manager"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                value={newAction.target_date || ''}
                onChange={(e) =>
                  setNewAction((prev) => ({
                    ...prev,
                    target_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAction}
              disabled={!newAction.action_description || createAction.isPending}
            >
              {createAction.isPending ? 'Adding...' : 'Add Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actions */}
      <div className="flex justify-end gap-4 border-t pt-4">
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={isSaving}
        >
          Save Draft
        </Button>
        <Button onClick={() => handleSave(true)} disabled={isSaving}>
          <Check className="mr-2 h-4 w-4" />
          Complete & Continue
        </Button>
      </div>
    </div>
  )
}
