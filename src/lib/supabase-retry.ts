import { createClient } from '@/lib/supabase/client'

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
}

/**
 * Waits for profile to exist after signup
 * Handles slow database triggers or mobile connections
 */
export async function waitForProfile(
  userId: string,
  options: RetryOptions = {}
): Promise<any> {
  const {
    maxAttempts = 10,
    delayMs = 500,
    backoffMultiplier = 1.5
  } = options

  const supabase = createClient()
  let currentDelay = delayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[Profile Check] Attempt ${attempt}/${maxAttempts}`)

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

    // Profile found!
    if (profile && !error) {
      console.log('[Profile Check] ✅ Profile found:', profile)
      return profile
    }

    // If not found and not last attempt, wait and retry
    if (attempt < maxAttempts) {
      console.log(`[Profile Check] Profile not found yet (User: ${userId}), retrying in ${currentDelay}ms...`)
      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay = Math.floor(currentDelay * backoffMultiplier)
    }
  }

  // Max attempts reached
  console.warn(`[Profile Check] ❌ Trigger failed to create profile for user ${userId} after ${maxAttempts} attempts.`)
  return null // Return null to trigger manual creation fallback
}

/**
 * Ensures profile exists, creates it if missing (fallback mechanism)
 */
export async function ensureProfileExists(
  userId: string,
  email: string,
  metadata: any = {}
): Promise<any> {
  const supabase = createClient()

  // First try to get it again (last check)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (profile) return profile

  // If missing, try to create it (backend trigger might have failed)
  console.log('[Profile Check] ⚠️ Profile missing, attempt manual creation...')
  
    const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          role: metadata.role || 'owner',
          full_name: `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim(),
          onboarding_completed: false,
          tenant_id: metadata.tenantId || '00000000-0000-0000-0000-000000000000'
        })
        .select()
        .single()

  if (error) {
    // If conflict (created by trigger/other process in the meantime), try to fetch again
    if (error.code === '23505') {
      console.log('[Profile Check] 📝 Profile conflict (23505), fetching existing...')
      const { data: retryProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      return retryProfile
    }
    console.error('[Profile Check] Manual creation failed:', error)
    throw error
  }

  return newProfile
}

/**
 * Combined wait and fallback creation using robust let/else pattern
 */
export async function waitForOrCreateProfile(
  userId: string,
  email: string,
  metadata: any = {},
  options: RetryOptions = {}
): Promise<any> {
  // Use let/else pattern for robust state management
  let profile = null;

  // Attempt 1: Wait for trigger to create profile
  console.log('[Profile Check] Step 1: Waiting for profile trigger...');
  profile = await waitForProfile(userId, options);

  // Robust fallback logic (Step 2)
  if (!profile) {
    // Step 2: Create profile manually if it doesn't exist
    try {
      console.log('[Profile Check] Step 2: Attempting manual profile creation...');
      profile = await ensureProfileExists(userId, email, metadata);
    } catch (fallbackErr) {
      console.error('[Profile Check] Step 2 failed:', fallbackErr);
      throw fallbackErr;
    }
  } else {
    console.log('[Profile Check] Profile found successfully via trigger.');
  }

  // Final validation
  if (!profile) {
    throw new Error('Profile could not be resolved after all attempts.');
  }

  return profile;
}
