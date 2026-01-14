import { createClient } from '@/lib/supabase-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/onboarding'

  if (code) {
    const supabase = createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to login with error
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Email verification failed. Please try again.')}`, requestUrl.origin)
      )
    }

    // Get the user's role from metadata
    const { data: { user } } = await supabase.auth.getUser()
    
    // Redirect based on user role
    if (user?.user_metadata?.role === 'owner') {
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
    } else {
      return NextResponse.redirect(new URL('/setup', requestUrl.origin))
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
