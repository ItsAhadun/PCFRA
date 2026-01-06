'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ScanQRPage() {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    function onScanSuccess(decodedText: string, decodedResult: any) {
      // Handle the scanned code as you retrieve it
      console.log(`Code matched = ${decodedText}`, decodedResult)
      setScanResult(decodedText)

      // Stop scanning after success if desired, or keep scanning
      // scanner.clear()

      toast.success('QR Code Scanned!', {
        description: `Content: ${decodedText}`,
      })
    }

    function onScanFailure(error: any) {
      // handle scan failure, usually better to ignore and keep scanning.
      // for example:
      // console.warn(`Code scan error = ${error}`);
    }

    // Use a reference to track if the effect is active
    let isMounted = true
    let scanner: Html5QrcodeScanner | null = null

    // Give a small delay to ensure DOM is ready and previous instances are cleared
    const initTimer = setTimeout(() => {
      if (!isMounted) return

      // Clean up any existing scanner content manually if needed
      const readerElement = document.getElementById('reader')
      if (readerElement) {
        readerElement.innerHTML = ''
      }

      scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          // aspectRatio: 1.0,
        },
        /* verbose= */ false,
      )

      try {
        scanner.render(onScanSuccess, onScanFailure)
      } catch (renderErr) {
        console.error('Error starting scanner:', renderErr)
        if (isMounted) {
          setError(
            'Failed to start camera. Please ensure you have granted camera permissions.',
          )
        }
      }
    }, 100)

    // Cleanup function
    return () => {
      isMounted = false
      clearTimeout(initTimer)
      if (scanner) {
        scanner.clear().catch((error) => {
          console.error('Failed to clear html5-qrcode scanner. ', error)
        })
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Scan QR Code</h1>
        <p className="text-muted-foreground">
          Scan a QR code to quickly access tenant information or perform
          actions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
            <CardDescription>Point your camera at a QR code.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div
              id="reader"
              className="overflow-hidden rounded-md border bg-slate-100 dark:bg-slate-900"
            ></div>

            {/* Custom styles for the scanner to match shadcn/ui somewhat */}
            <style jsx global>{`
              #reader {
                width: 100%;
                height: 100%;
                overflow: hidden;
                position: relative;
              }
              #reader video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover;
                border-radius: 0.375rem;
              }
              #reader__scan_region {
                background: transparent;
              }
              #reader__dashboard_section_csr span,
              #reader__dashboard_section_swaplink {
                display: none !important;
              }
              #reader__dashboard_section_csr button {
                display: none !important;
              }
            `}</style>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan Result</CardTitle>
            <CardDescription>
              The content of the scanned QR code will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanResult ? (
              <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center duration-300">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <div className="space-y-1">
                  <p className="font-medium">Successfully Scanned</p>
                  <p className="text-muted-foreground bg-muted rounded p-2 font-mono text-sm break-all">
                    {scanResult}
                  </p>
                </div>
                {/* Add action buttons here later based on what the QR code contains */}
              </div>
            ) : (
              <div className="text-muted-foreground flex h-[300px] flex-col items-center justify-center space-y-2 rounded-lg border border-dashed p-8 text-center">
                <div className="bg-muted/50 h-12 w-12 rounded-full p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-full w-full"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
                    />
                  </svg>
                </div>
                <p>Waiting for scan...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
