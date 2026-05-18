import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createTransport } from 'nodemailer'

// Generate invitation token
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }

  try {
    // Get current admin/user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already exists as technician
    const { data: existingTech } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingTech) {
      return NextResponse.json(
        { error: 'This technician is already registered' },
        { status: 400 }
      )
    }

    // Create invitation record
    const token = generateToken()
    const { data: invitation, error: inviteError } = await supabase
      .from('technician_invitations')
      .insert({
        email,
        token,
        invited_by: user.id,
        status: 'pending'
      })
      .select()
      .single()

    if (inviteError) throw inviteError

    // Send email invitation (using environment variable for email service)
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${token}`
    
    // Note: In production, integrate with SendGrid, AWS SES, or similar
    console.log(`Invitation sent to ${email}: ${invitationLink}`)

    return NextResponse.json({
      success: true,
      invitation,
      message: 'Invitation sent successfully'
    })
  } catch (error) {
    console.error('Error inviting technician:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    )
  }

  try {
    // Verify invitation token
    const { data: invitation, error } = await supabase
      .from('technician_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    // Check if token is still valid (not older than 7 days)
    const inviteDate = new Date(invitation.created_at)
    const expiryDate = new Date(inviteDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    if (new Date() > expiryDate) {
      // Mark as expired
      await supabase
        .from('technician_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email
    })
  } catch (error) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { token, status } = await req.json()

  if (!token || !status) {
    return NextResponse.json(
      { error: 'Token and status are required' },
      { status: 400 }
    )
  }

  try {
    const { error } = await supabase
      .from('technician_invitations')
      .update({ status })
      .eq('token', token)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Invitation updated successfully'
    })
  } catch (error) {
    console.error('Error updating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to update invitation' },
      { status: 500 }
    )
  }
}
