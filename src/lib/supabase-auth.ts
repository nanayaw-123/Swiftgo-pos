import { createClient as createBaseClient } from '@/lib/supabase/client'

// Browser client for client components
// This file must be safe to import in Client Components
export function createSupabaseServerClient() {
  return createBaseClient()
}
