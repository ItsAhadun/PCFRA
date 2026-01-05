'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  MapPin,
  Camera,
  Trash2,
  CheckCircle,
  Edit,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { RiskBadge } from './risk-matrix'
import type { Hazard, HazardType } from '@/types'
import { HAZARD_TYPES } from '@/types'

interface HazardCardProps {
  hazard: Hazard
  onEdit?: () => void
  onDelete?: () => void
  onResolve?: () => void
  onAddPhoto?: () => void
  showActions?: boolean
  className?: string
}

export function HazardCard({
  hazard,
  onEdit,
  onDelete,
  onResolve,
  onAddPhoto,
  showActions = true,
  className,
}: HazardCardProps) {
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const isCritical = hazard.risk_level === 'critical'

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev < hazard.photo_urls.length - 1 ? prev + 1 : 0,
    )
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev > 0 ? prev - 1 : hazard.photo_urls.length - 1,
    )
  }

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden transition-all',
          isCritical && 'border-red-500 ring-2 ring-red-500/20',
          hazard.is_resolved && 'opacity-60',
          className,
        )}
      >
        {/* Critical warning banner */}
        {isCritical && !hazard.is_resolved && (
          <div className="flex items-center gap-2 bg-red-500 px-4 py-2 text-white">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Critical Risk - Immediate Action Required
            </span>
          </div>
        )}

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">{hazard.location}</span>
            </div>
            {hazard.hazard_type && (
              <Badge variant="secondary" className="text-xs">
                {HAZARD_TYPES[hazard.hazard_type]}
              </Badge>
            )}
          </div>
          <RiskBadge level={hazard.risk_level} score={hazard.risk_score} />
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          <p className="text-sm">{hazard.description}</p>

          {/* Risk scores */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Severity:</span>
              <span className="font-medium">{hazard.severity}/5</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Likelihood:</span>
              <span className="font-medium">{hazard.likelihood}/5</span>
            </div>
          </div>

          {/* Control measures */}
          {hazard.control_measures && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                Control Measures
              </p>
              <p className="text-sm">{hazard.control_measures}</p>
            </div>
          )}

          {/* Photo thumbnails */}
          {hazard.photo_urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hazard.photo_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentPhotoIndex(index)
                    setPhotoDialogOpen(true)
                  }}
                  className="hover:ring-primary relative h-16 w-16 overflow-hidden rounded-lg border hover:ring-2"
                >
                  <Image
                    src={url}
                    alt={`Hazard photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Resolved status */}
          {hazard.is_resolved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Resolved</span>
              {hazard.resolved_at && (
                <span className="text-muted-foreground text-xs">
                  on {new Date(hazard.resolved_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {onAddPhoto && !hazard.is_resolved && (
                <Button variant="outline" size="sm" onClick={onAddPhoto}>
                  <Camera className="mr-1 h-4 w-4" />
                  Add Photo
                </Button>
              )}
              {onEdit && !hazard.is_resolved && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
              {onResolve && !hazard.is_resolved && (
                <Button variant="outline" size="sm" onClick={onResolve}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Mark Resolved
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Hazard?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this hazard and any
                        associated actions. This action cannot be undone.
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
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo viewer dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Photo {currentPhotoIndex + 1} of {hazard.photo_urls.length}
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video">
            <Image
              src={hazard.photo_urls[currentPhotoIndex]}
              alt={`Hazard photo ${currentPhotoIndex + 1}`}
              fill
              className="rounded-lg object-contain"
            />
            {hazard.photo_urls.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-1/2 left-2 -translate-y-1/2"
                  onClick={prevPhoto}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={nextPhoto}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Compact hazard list item
 */
export function HazardListItem({
  hazard,
  onClick,
  className,
}: {
  hazard: Hazard
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'hover:bg-muted flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
        hazard.risk_level === 'critical' && 'border-red-500',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <MapPin className="text-muted-foreground h-3 w-3 shrink-0" />
          <span className="truncate text-sm font-medium">
            {hazard.location}
          </span>
        </div>
        <p className="text-muted-foreground truncate text-xs">
          {hazard.description}
        </p>
      </div>
      <RiskBadge level={hazard.risk_level} score={hazard.risk_score} />
    </button>
  )
}
