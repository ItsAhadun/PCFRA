'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void
  onClear?: () => void
  width?: number
  height?: number
  className?: string
  initialValue?: string
}

export function SignatureCanvas({
  onSave,
  onClear,
  width = 400,
  height = 200,
  className,
  initialValue,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for high DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Set drawing styles
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Fill with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Load initial value if provided
    if (initialValue) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        setHasSignature(true)
      }
      img.src = initialValue
    }
  }, [width, height, initialValue])

  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const pos = getPosition(e)
      setLastPos(pos)
      setIsDrawing(true)
    },
    [getPosition],
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      if (!isDrawing) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      const pos = getPosition(e)

      ctx.beginPath()
      ctx.moveTo(lastPos.x, lastPos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()

      setLastPos(pos)
      setHasSignature(true)
    },
    [isDrawing, lastPos, getPosition],
  )

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onClear?.()
  }, [onClear])

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }, [hasSignature, onSave])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-1">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair touch-none rounded"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-muted-foreground text-center text-sm">
        Sign above using your mouse or finger
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={clearCanvas}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          type="button"
          onClick={saveSignature}
          disabled={!hasSignature}
          className="flex-1"
        >
          Save Signature
        </Button>
      </div>
    </div>
  )
}
