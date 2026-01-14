/**
 * Cloudflare Turnstile verification utilities
 */

export interface TurnstileVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
  action?: string
  cdata?: string
  metadata?: {
    interactive?: boolean
  }
}

/**
 * Verify a Turnstile token on the server side
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerifyResponse> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    throw new Error('TURNSTILE_SECRET_KEY environment variable is not set')
  }

  const formData = new URLSearchParams()
  formData.append('secret', secretKey)
  formData.append('response', token)
  
  if (remoteIp) {
    formData.append('remoteip', remoteIp)
  }

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error(`Turnstile verification request failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Error code descriptions for better error messages
 */
export const TURNSTILE_ERROR_CODES: Record<string, string> = {
  'missing-input-secret': 'The secret parameter is missing',
  'invalid-input-secret': 'The secret parameter is invalid or malformed',
  'missing-input-response': 'The response parameter (token) is missing',
  'invalid-input-response': 'The response parameter (token) is invalid or malformed',
  'bad-request': 'The request is invalid or malformed',
  'timeout-or-duplicate': 'The response token has already been validated or has expired',
  'internal-error': 'An internal error happened while validating the response',
}

/**
 * Get a human-readable error message for Turnstile error codes
 */
export function getTurnstileErrorMessage(errorCodes?: string[]): string {
  if (!errorCodes || errorCodes.length === 0) {
    return 'Verification failed'
  }

  const messages = errorCodes.map(
    (code) => TURNSTILE_ERROR_CODES[code] || `Unknown error: ${code}`
  )

  return messages.join(', ')
}

/**
 * Middleware helper to verify Turnstile token from request
 */
export async function verifyTurnstileFromRequest(
  request: Request
): Promise<{ success: boolean; error?: string }> {
  try {
    const contentType = request.headers.get('content-type') || ''
    let token: string | undefined

    if (contentType.includes('application/json')) {
      const body = await request.json()
      token = body.turnstileToken || body.token
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      token = formData.get('turnstileToken')?.toString() || formData.get('token')?.toString()
    }

    if (!token) {
      return { success: false, error: 'Turnstile token is missing' }
    }

    const ip = request.headers.get('CF-Connecting-IP') || 
                request.headers.get('X-Forwarded-For') ||
                undefined

    const result = await verifyTurnstileToken(token, ip)

    if (!result.success) {
      return {
        success: false,
        error: getTurnstileErrorMessage(result['error-codes']),
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    }
  }
}
