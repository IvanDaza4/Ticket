import { NextRequest, NextResponse } from 'next/server'
import { generateTicketEmbedding } from '@/app/actions/ai-actions'

export async function POST(req: NextRequest) {
  try {
    const { ticketId, subject, description, resolutionNotes } = await req.json()

    if (!ticketId || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate embedding for this ticket
    const result = await generateTicketEmbedding(ticketId, subject, description, resolutionNotes)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in AI learn endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process learning request' },
      { status: 500 }
    )
  }
}
