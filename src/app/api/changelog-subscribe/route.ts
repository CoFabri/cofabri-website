import { NextRequest, NextResponse } from 'next/server'
import { changelogSubscribeSchema } from '../../../lib/validation/schemas'

function getTurnstileSecretKey(): string {
  return process.env.NODE_ENV === 'development' && !process.env.TURNSTILE_SECRET_KEY
    ? '1x0000000000000000000000000000000AA'
    : (process.env.TURNSTILE_SECRET_KEY as string)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = changelogSubscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : ''
    if (turnstileToken !== 'development-mode') {
      const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: getTurnstileSecretKey(),
          response: turnstileToken,
          remoteip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        }),
      })
      const turnstileResult = await turnstileResponse.json()
      if (!turnstileResult.success) {
        return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 400 })
      }
    }

    if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
      return NextResponse.json({ error: 'Subscribe service temporarily unavailable' }, { status: 503 })
    }

    let apiRes: Response
    try {
      apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/changelog-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.COFABRI_API_KEY}` },
        body: JSON.stringify({ app_id: parsed.data.appId, email: parsed.data.email }),
      })
    } catch {
      return NextResponse.json({ error: 'Failed to subscribe. Please try again later.' }, { status: 502 })
    }
    if (!apiRes.ok) {
      return NextResponse.json({ error: 'Failed to subscribe. Please try again later.' }, { status: 502 })
    }

    return NextResponse.json({ message: 'Subscribed' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to process request. Please try again later.' }, { status: 500 })
  }
}
