'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-red-700">
              Something went wrong!
            </h2>
            <p className="mt-2 text-sm text-red-600">
              A critical error occurred. Our team has been notified.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-red-500">
                Error ID: {error.digest}
              </p>
            )}
            <div className="mt-6">
              <Button onClick={() => reset()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
