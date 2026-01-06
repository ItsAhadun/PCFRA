'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Camera } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ScanQRPage() {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt'
  >('prompt')
  const [scannerInitialized, setScannerInitialized] = useState(false)

  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      // Stop the stream immediately - we just needed to trigger the permission
      stream.getTracks().forEach((track) => track.stop())
      setPermissionStatus('granted')
      // Re-trigger scanner initialization
      setScannerInitialized(false)
      setTimeout(() => setScannerInitialized(true), 100)
    } catch (err: unknown) {
      console.error('Camera permission error:', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setPermissionStatus('denied')
        setError(
          'Camera permission was denied. Please enable camera access in your browser settings and reload the page.',
        )
      } else {
        setError(
          'Failed to access camera. Please ensure your device has a camera and try again.',
        )
      }
    }
  }, [])

  // Check initial permission status
  useEffect(() => {
    // Skip on server or if permissions API not available (we default to 'prompt')
    if (typeof window === 'undefined' || !navigator.permissions) {
      return
    }

    navigator.permissions
      .query({ name: 'camera' as PermissionName })
      .then((result) => {
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')

        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt')
        }
      })
      .catch(() => {
        // Permissions API not supported for camera, keep default 'prompt'
      })
  }, [])

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Don't initialize if permission is denied
    if (permissionStatus === 'denied') return

    function onScanSuccess(decodedText: string) {
      // Handle the scanned code as you retrieve it
      console.log(`Code matched = ${decodedText}`)
      setScanResult(decodedText)

      toast.success('QR Code Scanned!', {
        description: `Content: ${decodedText}`,
      })
    }

    function onScanFailure() {
      // handle scan failure, usually better to ignore and keep scanning.
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
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false,
      )

      try {
        scanner.render(onScanSuccess, onScanFailure)
        setScannerInitialized(true)
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
  }, [permissionStatus, scannerInitialized])

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

            {/* Show permission request button when permission not granted */}
            {permissionStatus === 'prompt' && !scannerInitialized && (
              <div className="mb-4 flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8">
                <Camera className="text-muted-foreground h-12 w-12" />
                <div className="space-y-2 text-center">
                  <p className="font-medium">Camera Access Required</p>
                  <p className="text-muted-foreground text-sm">
                    Tap the button below to enable camera access for QR scanning
                  </p>
                </div>
                <Button onClick={requestCameraPermission} size="lg">
                  <Camera className="mr-2 h-4 w-4" />
                  Enable Camera
                </Button>
              </div>
            )}

            {permissionStatus === 'denied' && (
              <div className="border-destructive flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8">
                <AlertCircle className="text-destructive h-12 w-12" />
                <div className="space-y-2 text-center">
                  <p className="font-medium">Camera Access Denied</p>
                  <p className="text-muted-foreground text-sm">
                    Please enable camera permissions in your browser settings
                    and reload this page.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            )}

            <div
              id="reader"
              className={`overflow-hidden rounded-md border bg-slate-100 dark:bg-slate-900 ${
                permissionStatus === 'denied' ||
                (!scannerInitialized && permissionStatus === 'prompt')
                  ? 'hidden'
                  : ''
              }`}
            ></div>

            {/* Custom styles for the scanner to match shadcn/ui somewhat */}
            <style jsx global>{`
              #reader {
                width: 100%;
                min-height: 300px;
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
              /* Style the scanner dashboard to look better */
              #reader__dashboard {
                padding: 1rem;
              }
              #reader__dashboard_section_csr {
                margin-bottom: 0.5rem;
              }
              #reader__dashboard_section_csr button {
                padding: 0.5rem 1rem;
                background: hsl(var(--primary));
                color: hsl(var(--primary-foreground));
                border: none;
                border-radius: 0.375rem;
                cursor: pointer;
                font-size: 0.875rem;
              }
              #reader__dashboard_section_csr button:hover {
                opacity: 0.9;
              }
              #reader__dashboard_section_csr select {
                padding: 0.5rem;
                border: 1px solid hsl(var(--border));
                border-radius: 0.375rem;
                background: hsl(var(--background));
                color: hsl(var(--foreground));
                margin-top: 0.5rem;
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
