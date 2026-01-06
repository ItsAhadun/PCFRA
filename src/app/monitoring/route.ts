import { NextRequest, NextResponse } from 'next/server'

/**
 * Sentry monitoring tunnel route.
 * This route forwards Sentry events to bypass ad-blockers.
 *
 * Note: This is a simplified implementation. The full tunnel
 * requires the Sentry DSN to be configured and event forwarding logic.
 * For production, consider using Sentry's built-in tunnel or edge function.
 */

const SENTRY_HOST = 'sentry.io'

export async function POST(request: NextRequest) {
  try {
    const envelope = await request.text()
    const pieces = envelope.split('\n')

    // Parse the envelope header to get the DSN
    const header = JSON.parse(pieces[0])
    const dsn = new URL(header.dsn)
    const projectId = dsn.pathname.replace('/', '')

    // Forward to Sentry
    const sentryUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`

    const response = await fetch(sentryUrl, {
      method: 'POST',
      body: envelope,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    })

    return new NextResponse(null, { status: response.status })
  } catch (error) {
    console.error('Sentry tunnel error:', error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({ status: 'ok' })
}
