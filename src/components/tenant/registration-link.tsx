'use client'

import { useState } from 'react'
import {
  useCreateRegistrationToken,
  useRegistrationTokens,
  useDeleteRegistrationToken,
} from '@/hooks/use-registration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
  Trash2,
  Clock,
  CheckCircle,
  ExternalLink,
  QrCode,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useRef, useEffect } from 'react'
import type { Site, RegistrationToken } from '@/types'

interface GenerateRegistrationLinkProps {
  site: Site
}

export function GenerateRegistrationLink({
  site,
}: GenerateRegistrationLinkProps) {
  const [open, setOpen] = useState(false)
  const [generatedToken, setGeneratedToken] =
    useState<RegistrationToken | null>(null)
  const [copied, setCopied] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(30)

  const createToken = useCreateRegistrationToken()
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const getRegistrationUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/resident/register/${token}`
  }

  useEffect(() => {
    if (!generatedToken) {
      setTimeout(() => setQrDataUrl(''), 0)
      return
    }

    const generateQR = async () => {
      try {
        const url = getRegistrationUrl(generatedToken.token)
        const dataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
        setQrDataUrl(dataUrl)
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    }

    generateQR()
  }, [generatedToken])

  const handleGenerate = async () => {
    try {
      const token = await createToken.mutateAsync({
        site_id: site.id,
        expires_in_days: expiresInDays,
      })
      setGeneratedToken(token)
    } catch {
      // Error handled by mutation
    }
  }

  const handleCopy = async () => {
    if (!generatedToken) return
    const url = getRegistrationUrl(generatedToken.token)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setOpen(false)
    setGeneratedToken(null)
    setExpiresInDays(30)
    setQrDataUrl('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
        setOpen(isOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LinkIcon className="mr-2 h-4 w-4" />
          Generate Registration Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Registration Link</DialogTitle>
          <DialogDescription>
            Create a unique link for residents to fill out their emergency
            information for {site.name}.
          </DialogDescription>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>How it works:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                <li>1. Generate a unique registration link</li>
                <li>2. Share the link with all residents</li>
                <li>3. Residents enter their apartment info and details</li>
                <li>4. Once registered, you can print their QR codes</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Link Active For (Days)</Label>
              <Input
                id="expires"
                type="number"
                min={1}
                max={90}
                value={expiresInDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 30
                  setExpiresInDays(Math.max(1, Math.min(90, val)))
                }}
              />
              <p className="text-xs text-gray-500">
                Minimum 1 day, maximum 90 days
              </p>
            </div>

            <DialogFooter>
              <Button
                onClick={handleGenerate}
                disabled={createToken.isPending}
                className="w-full"
              >
                {createToken.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Generate Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Link Generated!</span>
              </div>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                For building: {site.name}
              </p>
            </div>

            {/* Display QR Code */}
            {qrDataUrl && (
              <div className="flex justify-center py-2">
                <div className="rounded-lg border bg-white p-2 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Registration Link QR Code"
                    className="h-[150px] w-[150px]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Registration Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={getRegistrationUrl(generatedToken.token)}
                  className="text-xs"
                />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Expires on{' '}
              {new Date(generatedToken.expires_at).toLocaleDateString()}.
              Multiple residents can use this link to register.
            </p>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleClose}>
                Generate Another
              </Button>
              <Button
                onClick={() => {
                  window.open(
                    getRegistrationUrl(generatedToken.token),
                    '_blank',
                  )
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview Link
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface PendingRegistrationsProps {
  siteId: string
}

// Helper component to display QR code in a dialog
function RegistrationQRCodeModal({
  token,
  isOpen,
  onClose,
  getRegistrationUrl,
}: {
  token: RegistrationToken | null
  isOpen: boolean
  onClose: () => void
  getRegistrationUrl: (token: string) => string
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    if (!isOpen || !token) return

    const generateQR = async () => {
      try {
        const url = getRegistrationUrl(token.token)
        const dataUrl = await QRCode.toDataURL(url, {
          width: 250,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
        setQrDataUrl(dataUrl)
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    }

    generateQR()
  }, [isOpen, token, getRegistrationUrl])

  if (!token) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">
            Registration QR Code
          </DialogTitle>
          <DialogDescription className="text-center">
            Scan to register
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <div className="overflow-hidden rounded-lg border bg-white p-2 shadow-sm">
            {qrDataUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Registration QR Code"
                  className="h-[250px] w-[250px]"
                />
              </>
            ) : (
              <div className="flex h-[250px] w-[250px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PendingRegistrations({ siteId }: PendingRegistrationsProps) {
  const { data: tokens, isLoading } = useRegistrationTokens(siteId)
  const deleteToken = useDeleteRegistrationToken()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [viewingQrToken, setViewingQrToken] =
    useState<RegistrationToken | null>(null)

  if (isLoading) {
    return null
  }

  const pendingTokens = tokens?.filter((t) => !t.used_at) || []
  const usedTokens = tokens?.filter((t) => t.used_at) || []

  if (pendingTokens.length === 0 && usedTokens.length === 0) {
    return null
  }

  const getRegistrationUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/resident/register/${token}`
  }

  const handleCopy = async (token: string) => {
    const url = getRegistrationUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <div className="space-y-4">
      <RegistrationQRCodeModal
        token={viewingQrToken}
        isOpen={!!viewingQrToken}
        onClose={() => setViewingQrToken(null)}
        getRegistrationUrl={getRegistrationUrl}
      />

      {pendingTokens.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Pending Registration Links ({pendingTokens.length})
          </h4>
          <div className="space-y-2">
            {pendingTokens.map((token, index) => (
              <div
                key={token.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Registration Link</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {isExpired(token.expires_at) ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        <span>
                          Expires{' '}
                          {new Date(token.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(token.token)}
                    title="Copy registration link"
                  >
                    {copiedToken === token.token ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setViewingQrToken(token)}
                    title="Show QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteToken.mutate({ id: token.id, siteId })}
                    title="Delete registration link"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {usedTokens.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Completed Registrations ({usedTokens.length})
          </h4>
          <div className="space-y-2">
            {usedTokens.slice(0, 5).map((token) => (
              <div
                key={token.id}
                className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">
                    {token.tenant?.tenant_name || 'Registered Tenant'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Registered {new Date(token.used_at!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
