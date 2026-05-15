import { NextRequest, NextResponse } from 'next/server'
import { getAISuggestions, recordSuggestionFeedback } from '@/app/actions/ai-actions'

export async function POST(req: NextRequest) {
  try {
    const { ticketId, subject, description } = await req.json()

    if (!ticketId || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await getAISuggestions(ticketId, subject, description)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in AI suggestions endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to get AI suggestions' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { suggestionId, wasHelpful, feedback } = await req.json()

    if (!suggestionId || wasHelpful === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await recordSuggestionFeedback(suggestionId, wasHelpful, feedback)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error recording feedback:', error)
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    )
  }
}
