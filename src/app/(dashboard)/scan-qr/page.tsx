'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Html5Qrcode } from 'html5-qrcode'
import { toast } from 'sonner'
import {
  AlertCircle,
  CheckCircle2,
  Camera,
  SwitchCamera,
  RefreshCw,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CameraDevice {
  id: string
  label: string
}

export default function ScanQRPage() {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt'
  >('prompt')
  const [isScanning, setIsScanning] = useState(false)
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScannedRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)

  // Minimum time between accepting same QR code again (5 seconds)
  const DEBOUNCE_TIME = 5000

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        setIsScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }, [isScanning])

  const startScanner = useCallback(
    async (cameraId?: string) => {
      if (!scannerRef.current) return

      try {
        setError(null)

        const cameraIdToUse = cameraId || selectedCamera

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        }

        const onScanSuccess = (decodedText: string) => {
          const now = Date.now()

          // Check if this is a duplicate scan
          if (
            lastScannedRef.current === decodedText &&
            now - lastScanTimeRef.current < DEBOUNCE_TIME
          ) {
            // Same QR code scanned within debounce time, ignore
            return
          }

          // New scan or enough time has passed
          lastScannedRef.current = decodedText
          lastScanTimeRef.current = now
          setScanResult(decodedText)

          toast.success('QR Code Scanned!', {
            description:
              decodedText.length > 50
                ? `${decodedText.substring(0, 50)}...`
                : decodedText,
            id: 'qr-scan-success', // Use same ID to prevent duplicate toasts
          })
        }

        if (cameraIdToUse) {
          await scannerRef.current.start(
            cameraIdToUse,
            config,
            onScanSuccess,
            () => {}, // Ignore scan failures
          )
        } else {
          // Use back camera by default on mobile
          await scannerRef.current.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
            () => {},
          )
        }

        setIsScanning(true)
      } catch (err) {
        console.error('Error starting scanner:', err)
        setError(
          'Failed to start camera. Please check permissions and try again.',
        )
      }
    },
    [selectedCamera],
  )

  const switchCamera = useCallback(
    async (newCameraId: string) => {
      setSelectedCamera(newCameraId)
      if (isScanning) {
        await stopScanner()
        // Small delay before starting with new camera
        setTimeout(() => startScanner(newCameraId), 100)
      }
    },
    [isScanning, stopScanner, startScanner],
  )

  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      // Stop the stream immediately - we just needed to trigger the permission
      stream.getTracks().forEach((track) => track.stop())
      setPermissionStatus('granted')
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

  // Initialize scanner and get cameras when permission is granted
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (permissionStatus !== 'granted') return

    // Initialize the scanner
    scannerRef.current = new Html5Qrcode('reader')

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(
            devices.map((d) => ({
              id: d.id,
              label: d.label || `Camera ${d.id}`,
            })),
          )

          // Prefer back camera
          const backCamera = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment'),
          )
          const defaultCamera = backCamera || devices[0]
          setSelectedCamera(defaultCamera.id)

          // Auto-start scanning
          setTimeout(() => {
            if (scannerRef.current) {
              startScanner(defaultCamera.id)
            }
          }, 100)
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err)
        setError('Failed to detect cameras.')
      })

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [permissionStatus, startScanner])

  const handleRescan = () => {
    lastScannedRef.current = null
    lastScanTimeRef.current = 0
    setScanResult(null)
  }

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
            {permissionStatus === 'prompt' && (
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

            {permissionStatus === 'granted' && (
              <div className="space-y-4">
                {/* Camera controls */}
                {cameras.length > 1 && (
                  <div className="flex items-center gap-2">
                    <SwitchCamera className="text-muted-foreground h-4 w-4" />
                    <Select
                      value={selectedCamera || undefined}
                      onValueChange={switchCamera}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {cameras.map((camera) => (
                          <SelectItem key={camera.id} value={camera.id}>
                            {camera.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Scanner viewport */}
                <div
                  id="reader"
                  className="overflow-hidden rounded-lg border bg-slate-100 dark:bg-slate-900"
                ></div>

                {/* Scanner status */}
                {isScanning && (
                  <p className="text-muted-foreground animate-pulse text-center text-sm">
                    Scanning for QR codes...
                  </p>
                )}
              </div>
            )}

            {/* Custom styles for the scanner */}
            <style jsx global>{`
              #reader {
                width: 100%;
                min-height: 300px;
                position: relative;
              }
              #reader video {
                width: 100% !important;
                height: auto !important;
                min-height: 300px;
                object-fit: cover;
                border-radius: 0.5rem;
              }
              #reader__scan_region {
                background: transparent;
              }
              #reader__scan_region > img {
                display: none;
              }
              #reader__dashboard {
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
                <div className="w-full space-y-2">
                  <p className="font-medium">Successfully Scanned</p>
                  <p className="text-muted-foreground bg-muted rounded p-3 text-left font-mono text-sm break-all">
                    {scanResult}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRescan}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Scan Another
                  </Button>
                  {scanResult.startsWith('http') && (
                    <Button
                      size="sm"
                      onClick={() => window.open(scanResult, '_blank')}
                    >
                      Open Link
                    </Button>
                  )}
                </div>
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
