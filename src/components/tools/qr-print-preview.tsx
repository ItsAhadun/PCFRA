'use client'

import React from 'react'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { PrintQRDocument } from './qr-pdf-document'
import { Button } from '@/components/ui/button'
import { Loader2, Download, Printer } from 'lucide-react'

interface QRPrintPreviewProps {
  qrCodes: {
    id: string
    url: string
    label: string
    subLabel?: string
  }[]
  settings: {
    paperSize: 'A4' | 'LETTER'
    qrSize: number
    spacing: number
    showLabels: boolean
  }
  siteName?: string
}

export default function QRPrintPreview({
  qrCodes,
  settings,
  siteName,
}: QRPrintPreviewProps) {
  if (qrCodes.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
        <Printer className="mb-4 h-16 w-16 opacity-20" />
        <p>Select a building to view QR codes</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Download Button Area */}
      <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-950">
        <PDFDownloadLink
          document={<PrintQRDocument qrCodes={qrCodes} settings={settings} />}
          fileName={`${siteName || 'qr-codes'}.pdf`}
        >
          {/* @ts-ignore */}
          {({ blob, url, loading, error }) => (
            <Button className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Preview Area */}
      <div className="max-h-full flex-1 overflow-hidden border bg-white shadow-2xl dark:bg-gray-950">
        <PDFViewer
          width="100%"
          height="100%"
          className="h-full min-h-[500px] w-full"
          showToolbar={true}
        >
          <PrintQRDocument qrCodes={qrCodes} settings={settings} />
        </PDFViewer>
      </div>
    </div>
  )
}
