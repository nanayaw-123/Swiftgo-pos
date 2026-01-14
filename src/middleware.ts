import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/pos',
    '/onboarding',
    '/setup',
    '/api/dashboard',
    '/api/pos',
    '/api/products',
    '/api/inventory',
    '/api/sales',
    '/api/stores',
    '/api/users',
    '/api/profile',
    '/api/audit-logs', 
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Robustly check for Supabase auth token in cookies
  const allCookies = request.cookies.getAll()
  const authCookie = allCookies.find(c => 
    c.name.includes('auth-token') || 
    c.name.endsWith('?-access-token') ||
    c.name.includes('supabase-auth-token')
  )
  const authToken = authCookie?.value

  // 1. If trying to access protected route without auth token -> login
  if (isProtectedRoute && !authToken) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 2. If authenticated and on login/register -> redirect to root to let AuthGate decide
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && authToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

    // 3. For all other cases, including authenticated users on /onboarding or /setup,
    // we let the request through and let AuthGate handle the specific logic.
    return response
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
