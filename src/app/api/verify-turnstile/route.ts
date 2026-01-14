import { NextRequest, NextResponse } from 'next/server'
import { verifyTurnstileToken, getTurnstileErrorMessage } from '@/lib/cloudflare/turnstile'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Turnstile token is required' },
        { status: 400 }
      )
    }

    // Get client IP from Cloudflare headers
    const ip =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For') ||
      request.headers.get('X-Real-IP') ||
      undefined

    // Verify the token
    const result = await verifyTurnstileToken(token, ip)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: getTurnstileErrorMessage(result['error-codes']),
          errorCodes: result['error-codes'],
        },
        { status: 400 }
      )
    }

    // Optional: Log successful verification
    console.log('Turnstile verification successful:', {
      hostname: result.hostname,
      timestamp: result.challenge_ts,
      action: result.action,
    })

    return NextResponse.json({
      success: true,
      timestamp: result.challenge_ts,
      hostname: result.hostname,
    })
  } catch (error) {
    console.error('Turnstile verification error:', error)
    
    if (error instanceof Error && error.message.includes('TURNSTILE_SECRET_KEY')) {
      return NextResponse.json(
        { success: false, error: 'Turnstile is not configured on the server' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
