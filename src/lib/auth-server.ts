import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getServerSupabase() {
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

export async function getServerUser() {
  const supabase = await getServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireServerAuth() {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function getTenantIdFromUser(userId: string) {
  const supabase = await getServerSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', userId)
    .single()
  
  return data?.tenant_id || null
}
