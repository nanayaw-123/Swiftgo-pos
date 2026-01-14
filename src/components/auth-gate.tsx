'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, onboardingStatus } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

    useEffect(() => {
      if (loading) return
  
      const isPublicRoute = [
        '/', 
        '/login', 
        '/register', 
        '/about', 
        '/contact', 
        '/pricing', 
        '/privacy', 
        '/terms',
        '/features',
        '/blog',
        '/careers',
        '/security'
      ].includes(pathname)
      const isOnboardingRoute = pathname === '/onboarding'
      const isSetupRoute = pathname === '/setup'
      const isDashboardRoute = pathname.startsWith('/dashboard') || pathname === '/pos'
  
      if (onboardingStatus === 'SIGNED_OUT') {
        if (!isPublicRoute || isOnboardingRoute || isSetupRoute || isDashboardRoute) {
          router.replace('/login')
        }
        } else if (onboardingStatus === 'SIGNED_IN_NOT_ONBOARDED') {
          const userRole = profile?.role || (user?.user_metadata?.role as 'owner' | 'manager' | 'cashier') || 'owner'
          const target = userRole === 'owner' ? '/onboarding' : '/setup'
          
          const isCorrectPage = (userRole === 'owner' && isOnboardingRoute) || (userRole !== 'owner' && isSetupRoute)
          
          if (!isCorrectPage) {
            // ONLY redirect if we are on a page that isn't the correct onboarding page
            // and we are either on the root, login, register, or dashboard routes
            if (isDashboardRoute || pathname === '/login' || pathname === '/register' || pathname === '/') {
              console.log(`[AuthGate] Redirecting to ${target} because onboarding is incomplete.`)
              router.replace(target)
            } else if (isOnboardingRoute || isSetupRoute) {
              // If we're on the wrong onboarding page (e.g. manager on /onboarding), fix it
              console.log(`[AuthGate] Correcting onboarding route: ${pathname} -> ${target}`)
              router.replace(target)
            }
          }
        } else if (onboardingStatus === 'ONBOARDED') {
        // If already onboarded, don't allow access to onboarding/setup or auth pages
        if (isOnboardingRoute || isSetupRoute || pathname === '/login' || pathname === '/register') {
          router.replace('/dashboard')
        }
      }
    }, [loading, onboardingStatus, profile, user, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
