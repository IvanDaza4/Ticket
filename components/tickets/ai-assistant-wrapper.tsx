'use client'

import { AIAssistant } from './ai-assistant'

interface AIAssistantWrapperProps {
  ticketId: string
  subject: string
  description: string
}

export function AIAssistantWrapper({ ticketId, subject, description }: AIAssistantWrapperProps) {
  return (
    <AIAssistant
      ticketId={ticketId}
      subject={subject}
      description={description}
    />
  )
}
