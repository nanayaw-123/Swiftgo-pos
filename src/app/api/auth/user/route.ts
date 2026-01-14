import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getServerUser } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user profile with tenant info
    const supabase = await createSupabaseBrowserClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        profile: profile || null,
      }
    })
  } catch (error) {
    console.error('User error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email } = body

    const supabase = await createSupabaseBrowserClient()

    // Update user metadata
    const updates: any = {}
    if (firstName !== undefined) updates.first_name = firstName
    if (lastName !== undefined) updates.last_name = lastName

    if (Object.keys(updates).length > 0) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: updates
      })

      if (metadataError) {
        console.error('Metadata update error:', metadataError)
        return NextResponse.json(
          { error: metadataError.message },
          { status: 400 }
        )
      }
    }

    // Update email if provided
    if (email && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email
      })

      if (emailError) {
        console.error('Email update error:', emailError)
        return NextResponse.json(
          { error: emailError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
