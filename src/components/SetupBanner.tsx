'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SetupBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the banner
    const isDismissed = localStorage.getItem('setup_banner_dismissed')
    if (isDismissed) {
      setDismissed(true)
      return
    }

    // Check setup status
    fetch('/api/setup-status')
      .then(res => res.json())
      .then(data => {
        if (!data.all_configured) {
          setShowBanner(true)
        }
      })
      .catch(() => {
        // Silently fail - don't show banner if check fails
      })
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('setup_banner_dismissed', 'true')
  }

  if (dismissed || !showBanner) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm sm:text-base font-medium">
              <span className="hidden sm:inline">Database setup required to use SwiftPOS.</span>
              <span className="sm:hidden">Setup required.</span>
              {' '}
              <Link 
                href="/setup" 
                className="underline hover:no-underline font-bold"
              >
                Complete setup now
              </Link>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/setup">
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                <span className="hidden sm:inline">Go to Setup</span>
                <span className="sm:hidden">Setup</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
