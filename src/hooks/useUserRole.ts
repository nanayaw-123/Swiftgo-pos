import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase-auth'

export function useUserRole() {
  const { user, loading: authLoading } = useAuth()
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier' | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserProfile() {
      if (authLoading) return
      
      if (!user) {
        setRole(null)
        setTenantId(null)
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('role, tenant_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error fetching user role:', error)
          setRole(null)
          setTenantId(null)
        } else if (data) {
          setRole(data.role as 'owner' | 'manager' | 'cashier')
          setTenantId(data.tenant_id)
        } else {
          // No profile found - new user needs onboarding
          setRole(null)
          setTenantId(null)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setRole(null)
        setTenantId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user, authLoading])

  return { role, tenantId, userId: user?.id || null, loading }
}