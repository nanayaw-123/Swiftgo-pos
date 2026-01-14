'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onError?: (error?: string) => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      ready: (callback: () => void) => void
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact'
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          'timeout-callback'?: () => void
        }
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  const initTurnstile = useCallback(() => {
    if (!containerRef.current) return
    if (!window.turnstile) {
      console.warn('Turnstile script not loaded')
      return
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    if (!siteKey) {
      console.error('NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set')
      onError?.('Configuration error')
      return
    }

    try {
      // Remove existing widget if any
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
      }

      // Render new widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: onSuccess,
        'error-callback': () => {
          onError?.('Verification failed')
        },
        'expired-callback': () => {
          onExpire?.()
          onError?.('Token expired')
        },
        'timeout-callback': () => {
          onError?.('Verification timeout')
        },
      })
    } catch (error) {
      console.error('Failed to render Turnstile widget:', error)
      onError?.('Failed to load verification')
    }
  }, [onSuccess, onError, onExpire, theme, size])

  useEffect(() => {
    // Load Turnstile script
    if (typeof window !== 'undefined' && !window.turnstile) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.turnstile) {
          window.turnstile.ready(() => {
            initTurnstile()
          })
        }
      }
      script.onerror = () => {
        onError?.('Failed to load verification script')
      }
      document.head.appendChild(script)
    } else if (window.turnstile) {
      window.turnstile.ready(() => {
        initTurnstile()
      })
    }

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (error) {
          console.error('Failed to remove Turnstile widget:', error)
        }
      }
    }
  }, [initTurnstile, onError])

  return (
    <div ref={containerRef} className={className} />
  )
}
