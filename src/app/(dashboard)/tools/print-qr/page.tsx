'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSites } from '@/hooks/use-sites'
import { useTenants } from '@/hooks/use-tenants'
import QRCode from 'qrcode'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Printer, Download, RefreshCw } from 'lucide-react'
import type { Site } from '@/types'

// Dynamically import the preview component with NO SSR
const QRPrintPreview = dynamic(
  () => import('@/components/tools/qr-print-preview'),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        Loading PDF Renderer...
      </div>
    ),
  },
)

export default function PrintQRPage() {
  const { data: sites, isLoading: sitesLoading } = useSites()
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')

  // Settings state
  const [paperSize, setPaperSize] = useState<'A4' | 'LETTER'>('A4')

  const [qrSize, setQrSize] = useState([30]) // mm
  const [spacing, setSpacing] = useState([5]) // mm
  const [showLabels, setShowLabels] = useState(true)

  // Data fetching
  const { data: tenants, isLoading: tenantsLoading } = useTenants(
    selectedSiteId || undefined,
  )

  // QR Generation State
  const [generatedQRs, setGeneratedQRs] = useState<
    { id: string; url: string; label: string; subLabel?: string }[]
  >([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate QR Data URIs when tenants change
  useEffect(() => {
    const generateCodes = async () => {
      if (!tenants || tenants.length === 0) {
        setGeneratedQRs([])
        return
      }

      setIsGenerating(true)
      try {
        const codes = await Promise.all(
          tenants.map(async (tenant) => {
            // Generate the registration/info URL
            // Note: Using a placeholder URL structure based on requirements
            // Assuming we want to point to the tenant's public page or similar
            // Or if these are registration tokens, we'd need those URLs.
            // The prompt says "print all the qr codes", implying existing tenants.
            // Assuming tenant.qr_code_url exists or we construct a URL to view tenant safety info.
            // Let's use the origin + tenant ID for now, or tenant.qr_code_url if available.

            const url =
              tenant.qr_code_url ||
              `${window.location.origin}/resident/info/${tenant.id}`

            const qrDataUrl = await QRCode.toDataURL(url, {
              width: 400,
              margin: 1,
              errorCorrectionLevel: 'H',
            })

            return {
              id: tenant.id,
              url: qrDataUrl,
              label: `Apt ${tenant.apartment_number}`,
              subLabel: tenant.floor_number
                ? `Floor ${tenant.floor_number}`
                : undefined,
            }
          }),
        )
        setGeneratedQRs(codes)
      } catch (err) {
        console.error('Failed to generate QR codes', err)
      } finally {
        setIsGenerating(false)
      }
    }

    generateCodes()
  }, [tenants])

  const selectedSite = sites?.find((s) => s.id === selectedSiteId)

  return (
    <div className="container mx-auto flex h-full flex-col space-y-6 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Batch Print QR Codes
        </h1>
        <p className="text-muted-foreground">
          Generate and print QR codes for all residents in a building
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Controls Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Customize your print layout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Site Selection */}
              <div className="space-y-2">
                <Label>Select Building</Label>
                <Select
                  value={selectedSiteId}
                  onValueChange={setSelectedSiteId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        sitesLoading ? 'Loading...' : 'Select building'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Settings */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <Select
                    value={paperSize}
                    onValueChange={(v: any) => setPaperSize(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                      <SelectItem value="LETTER">
                        Letter (8.5 x 11 in)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>QR Size</Label>
                    <span className="text-muted-foreground text-sm">
                      {qrSize[0]} mm
                    </span>
                  </div>
                  <Slider
                    value={qrSize}
                    onValueChange={setQrSize}
                    min={20}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Spacing</Label>
                    <span className="text-muted-foreground text-sm">
                      {spacing[0]} mm
                    </span>
                  </div>
                  <Slider
                    value={spacing}
                    onValueChange={setSpacing}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="show-labels">Show Labels</Label>
                  <Switch
                    id="show-labels"
                    checked={showLabels}
                    onCheckedChange={setShowLabels}
                  />
                </div>
              </div>

              {/* Status Info */}
              <div className="text-muted-foreground border-t pt-4 text-sm">
                {selectedSiteId ? (
                  <div className="flex items-center justify-between">
                    <span>Items to print:</span>
                    <span className="font-medium">{generatedQRs.length}</span>
                  </div>
                ) : (
                  <p>Select a building to preview</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Area */}
        <div className="flex max-h-[calc(100vh-200px)] min-h-[600px] flex-col overflow-hidden rounded-xl border bg-gray-100 lg:col-span-2 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b bg-white p-4 dark:bg-gray-950">
            <Label className="flex items-center gap-2 font-medium">
              <Printer className="h-4 w-4" />
              Live Preview
            </Label>
            {(isGenerating || tenantsLoading) && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Preview...
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-gray-50/50 p-4 dark:bg-gray-900/50">
            <QRPrintPreview
              qrCodes={generatedQRs}
              settings={{
                paperSize,
                qrSize: qrSize[0],
                spacing: spacing[0],
                showLabels,
              }}
              siteName={selectedSite?.name}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
