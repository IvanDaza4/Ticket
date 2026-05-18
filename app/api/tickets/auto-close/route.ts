import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { ticketId, action } = await req.json()

  if (!ticketId || !action) {
    return NextResponse.json(
      { error: 'Missing ticketId or action' },
      { status: 400 }
    )
  }

  try {
    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, status, resolved_at')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // If ticket is resolved and client adds comment or closes, mark as closed
    if (ticket.status === 'resolved' && (action === 'comment' || action === 'close')) {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', ticketId)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Ticket automatically closed',
        status: 'closed'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No action needed',
      status: ticket.status
    })
  } catch (error) {
    console.error('Error processing ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}