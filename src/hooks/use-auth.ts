'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  tenant_id: string
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'owner' | 'manager' | 'cashier'
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingStatus, setOnboardingStatus] = useState<'LOADING' | 'SIGNED_OUT' | 'SIGNED_IN_NOT_ONBOARDED' | 'ONBOARDED'>('LOADING')
  const supabase = createClient()

    useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return

      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setOnboardingStatus('SIGNED_OUT')
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setOnboardingStatus('SIGNED_OUT')
        setLoading(false)
      } else if (session?.user) {
        await loadProfile(session.user.id)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

    const loadProfile = async (userId: string, retryCount = 0) => {
      // Only set loading true on the first attempt
      if (retryCount === 0) setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setProfile(data)
          setOnboardingStatus(data.onboarding_completed ? 'ONBOARDED' : 'SIGNED_IN_NOT_ONBOARDED')
          setLoading(false)
        } else if (retryCount < 10) {
          // Retry for trigger delay - profiles are created by auth.users trigger
          // Use exponential backoff for better reliability
          const nextRetryDelay = Math.min(500 * Math.pow(1.5, retryCount), 5000)
          console.log(`[useAuth] Profile not found, retrying in ${nextRetryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, nextRetryDelay))
          return loadProfile(userId, retryCount + 1)
        } else {
          // If profile still doesn't exist, we consider them signed in but not onboarded
          console.warn('[useAuth] Profile not found after max retries.')
          setOnboardingStatus('SIGNED_IN_NOT_ONBOARDED')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setOnboardingStatus('SIGNED_IN_NOT_ONBOARDED')
        setLoading(false)
      }
    }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setOnboardingStatus('SIGNED_OUT')
  }

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  return {
    user,
    session,
    profile,
    loading,
    onboardingStatus,
    signOut,
    getToken,
    isAuthenticated: !!user,
  }
}