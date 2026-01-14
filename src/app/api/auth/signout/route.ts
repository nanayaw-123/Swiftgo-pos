import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Sign out
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    })
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
