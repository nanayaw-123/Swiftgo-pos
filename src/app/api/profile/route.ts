import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 })
    }

    const supabase = getServerSupabase()
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 })
    }

    // Get profile using id (which matches auth user id)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, role, email, full_name, onboarding_completed')
      .eq('id', user.id)
      .single()
    
    if (error || !profile) {
      return NextResponse.json({ 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 })
    }

    return NextResponse.json({
      id: profile.id,
      role: profile.role,
      email: profile.email,
      fullName: profile.full_name,
      onboardingCompleted: profile.onboarding_completed
    }, { status: 200 })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}