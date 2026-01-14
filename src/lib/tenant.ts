import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function getCurrentTenant() {
  const supabase = await getServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('tenant_id, role, tenants(*)')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function requireTenant() {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    throw new Error('No tenant found')
  }
  return tenant
}