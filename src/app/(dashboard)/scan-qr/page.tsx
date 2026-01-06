'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
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
  User,
  Building,
  Phone,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTenantPublic } from '@/hooks/use-tenants'
import { cn } from '@/lib/utils'
import {
  QR_RISK_CLASSES,
  getTenantDisabilityFlags,
  RISK_LEVEL_TEXT,
} from '@/utils/qr-generator'
import Link from 'next/link'

interface CameraDevice {
  id: string
  label: string
}

/**
 * Extract tenant ID from a scanned URL
 * Expected format: https://domain.com/tenant/{uuid}
 */
function extractTenantId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const tenantIndex = pathParts.findIndex((part) => part === 'tenant')
    if (tenantIndex !== -1 && pathParts[tenantIndex + 1]) {
      const potentialUuid = pathParts[tenantIndex + 1]
      // Basic UUID validation
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          potentialUuid,
        )
      ) {
        return potentialUuid
      }
    }
    return null
  } catch {
    return null
  }
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
  const [isReady, setIsReady] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScannedRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const isMountedRef = useRef(true)

  // Minimum time between accepting same QR code again (5 seconds)
  const DEBOUNCE_TIME = 5000

  // Extract tenant ID from scan result
  const tenantId = useMemo(
    () => (scanResult ? extractTenantId(scanResult) : null),
    [scanResult],
  )

  // Fetch tenant data if we have a tenant ID
  const {
    data: tenant,
    isLoading: tenantLoading,
    error: tenantError,
  } = useTenantPublic(tenantId || undefined)

  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
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
      .catch(() => {})
  }, [])

  // Mark component as ready after mount
  useEffect(() => {
    isMountedRef.current = true
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)

    return () => {
      isMountedRef.current = false
      clearTimeout(timer)
    }
  }, [])

  // Initialize scanner when permission is granted and DOM is ready
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (permissionStatus !== 'granted') return
    if (!isReady) return

    const readerElement = document.getElementById('reader')
    if (!readerElement) {
      return
    }

    let localScanner: Html5Qrcode | null = null

    const initScanner = async () => {
      try {
        localScanner = new Html5Qrcode('reader')
        scannerRef.current = localScanner

        const devices = await Html5Qrcode.getCameras()

        if (!isMountedRef.current) return

        if (devices && devices.length > 0) {
          setCameras(
            devices.map((d) => ({
              id: d.id,
              label: d.label || `Camera ${d.id}`,
            })),
          )

          const backCamera = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment'),
          )
          const defaultCamera = backCamera || devices[0]
          setSelectedCamera(defaultCamera.id)

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          }

          const onScanSuccess = (decodedText: string) => {
            const now = Date.now()

            if (
              lastScannedRef.current === decodedText &&
              now - lastScanTimeRef.current < DEBOUNCE_TIME
            ) {
              return
            }

            lastScannedRef.current = decodedText
            lastScanTimeRef.current = now
            setScanResult(decodedText)

            toast.success('QR Code Scanned!', {
              description:
                decodedText.length > 50
                  ? `${decodedText.substring(0, 50)}...`
                  : decodedText,
              id: 'qr-scan-success',
            })
          }

          await localScanner.start(
            defaultCamera.id,
            config,
            onScanSuccess,
            () => {},
          )

          if (isMountedRef.current) {
            setIsScanning(true)
          }
        }
      } catch (err) {
        console.error('Error initializing scanner:', err)
        if (isMountedRef.current) {
          setError('Failed to start camera. Please try reloading the page.')
        }
      }
    }

    initScanner()

    return () => {
      if (localScanner) {
        // Check if scanner is in a running state before stopping
        const state = localScanner.getState()
        // State 2 = SCANNING, State 3 = PAUSED (these are the states we can stop from)
        if (state === 2 || state === 3) {
          localScanner
            .stop()
            .then(() => {
              localScanner = null
              scannerRef.current = null
            })
            .catch(() => {})
        } else {
          // Scanner not running, just clear the reference
          localScanner = null
          scannerRef.current = null
        }
      }
    }
  }, [permissionStatus, isReady])

  const switchCamera = async (newCameraId: string) => {
    if (!scannerRef.current) return

    setSelectedCamera(newCameraId)

    try {
      // Check if scanner is in a running state before stopping
      const state = scannerRef.current.getState()
      if (state === 2 || state === 3) {
        await scannerRef.current.stop()
        setIsScanning(false)
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      }

      const onScanSuccess = (decodedText: string) => {
        const now = Date.now()

        if (
          lastScannedRef.current === decodedText &&
          now - lastScanTimeRef.current < DEBOUNCE_TIME
        ) {
          return
        }

        lastScannedRef.current = decodedText
        lastScanTimeRef.current = now
        setScanResult(decodedText)

        toast.success('QR Code Scanned!', {
          description:
            decodedText.length > 50
              ? `${decodedText.substring(0, 50)}...`
              : decodedText,
          id: 'qr-scan-success',
        })
      }

      await scannerRef.current.start(
        newCameraId,
        config,
        onScanSuccess,
        () => {},
      )
      setIsScanning(true)
    } catch (err) {
      console.error('Error switching camera:', err)
      setError('Failed to switch camera.')
    }
  }

  const handleRescan = () => {
    lastScannedRef.current = null
    lastScanTimeRef.current = 0
    setScanResult(null)
  }

  // Get risk level info
  const riskLevel = tenant?.risk_level || 'low'
  const riskClasses = QR_RISK_CLASSES[riskLevel]
  const flags = tenant ? getTenantDisabilityFlags(tenant) : []

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

                <div
                  id="reader"
                  className="min-h-[300px] overflow-hidden rounded-lg border bg-slate-100 dark:bg-slate-900"
                ></div>

                {isScanning && (
                  <p className="text-muted-foreground animate-pulse text-center text-sm">
                    Scanning for QR codes...
                  </p>
                )}
              </div>
            )}

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
              {scanResult
                ? 'Tenant information from scanned QR code.'
                : 'The content of the scanned QR code will appear here.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanResult ? (
              <div className="space-y-4">
                {/* Loading state */}
                {tenantId && tenantLoading && (
                  <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8">
                    <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground">
                      Loading tenant information...
                    </p>
                  </div>
                )}

                {/* Tenant not found */}
                {tenantId && tenantError && (
                  <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed border-amber-500 p-8">
                    <AlertTriangle className="h-12 w-12 text-amber-500" />
                    <div className="text-center">
                      <p className="font-medium">Tenant Not Found</p>
                      <p className="text-muted-foreground text-sm">
                        This QR code may be outdated or invalid.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tenant found - display info */}
                {tenantId && tenant && !tenantLoading && (
                  <div className="space-y-4">
                    {/* Risk Level Badge */}
                    <div
                      className={cn(
                        'rounded-lg px-4 py-3 text-center text-white',
                        riskLevel === 'critical' && 'bg-red-600',
                        riskLevel === 'high' && 'bg-orange-500',
                        riskLevel === 'medium' &&
                          'bg-yellow-500 text-yellow-900',
                        riskLevel === 'low' && 'bg-green-600',
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {(riskLevel === 'critical' || riskLevel === 'high') && (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                        <span className="font-bold">
                          {riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                      <p className="text-sm opacity-90">
                        {RISK_LEVEL_TEXT[riskLevel]}
                      </p>
                    </div>

                    {/* Apartment Info */}
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Building className="h-3 w-3" />
                            <span>APARTMENT</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {tenant.apartment_number}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground text-xs">
                            FLOOR
                          </div>
                          <div className="text-2xl font-bold">
                            {tenant.floor_number}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 border-t pt-3">
                        <div className="flex items-center gap-2">
                          <User className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">
                            {tenant.tenant_name}
                          </span>
                        </div>
                        {tenant.number_of_occupants &&
                          tenant.number_of_occupants > 1 && (
                            <p className="text-muted-foreground ml-6 text-sm">
                              {tenant.number_of_occupants} occupants
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Special Requirements */}
                    {flags.length > 0 && (
                      <div className="rounded-lg border p-4">
                        <h3 className="mb-2 text-sm font-semibold">
                          ⚠️ Special Requirements
                        </h3>
                        <div className="space-y-1">
                          {flags.map((flag) => (
                            <div
                              key={flag.key}
                              className={cn(
                                'flex items-center gap-2 rounded px-2 py-1 text-sm',
                                flag.critical
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-muted',
                              )}
                            >
                              <span>{flag.icon}</span>
                              <span>{flag.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medical Info */}
                    {(tenant.allergies ||
                      tenant.medical_conditions ||
                      tenant.oxygen_dependent) && (
                      <div className="rounded-lg border p-4">
                        <h3 className="mb-2 text-sm font-semibold">
                          🏥 Medical Info
                        </h3>
                        <div className="space-y-2 text-sm">
                          {tenant.oxygen_dependent && (
                            <div className="rounded bg-red-100 px-2 py-1 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              <strong>🫁 OXYGEN DEPENDENT</strong>
                            </div>
                          )}
                          {tenant.allergies && (
                            <div className="rounded bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              <strong>Allergies:</strong> {tenant.allergies}
                            </div>
                          )}
                          {tenant.medical_conditions && (
                            <div className="rounded bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              <strong>Conditions:</strong>{' '}
                              {tenant.medical_conditions}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact */}
                    {tenant.emergency_contact_name && (
                      <div className="rounded-lg border p-4">
                        <h3 className="mb-2 text-sm font-semibold">
                          📞 Emergency Contact
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {tenant.emergency_contact_name}
                            </p>
                            {tenant.emergency_contact_phone && (
                              <p className="text-muted-foreground text-sm">
                                {tenant.emergency_contact_phone}
                              </p>
                            )}
                          </div>
                          {tenant.emergency_contact_phone && (
                            <a
                              href={`tel:${tenant.emergency_contact_phone}`}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow"
                            >
                              <Phone className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRescan}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Another
                      </Button>
                      <Link href={`/tenants/${tenantId}`}>
                        <Button size="sm" variant="secondary">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Full Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Non-tenant QR code */}
                {!tenantId && (
                  <div className="space-y-4">
                    <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-6 text-center duration-300">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                      <div className="w-full space-y-2">
                        <p className="font-medium">QR Code Scanned</p>
                        <p className="text-muted-foreground bg-muted rounded p-2 text-left font-mono text-xs break-all">
                          {scanResult}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRescan}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Another
                      </Button>
                      {scanResult.startsWith('http') && (
                        <Button
                          size="sm"
                          onClick={() => window.open(scanResult, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Link
                        </Button>
                      )}
                    </div>
                  </div>
                )}
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
