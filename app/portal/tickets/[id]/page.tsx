import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TicketDetailClient } from '@/components/tickets/ticket-detail-client'

interface TicketDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Verify ticket exists and user has access
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id')
    .eq('id', id)
    .single()

  if (error || !ticket) {
    notFound()
  }

  return <TicketDetailClient ticketId={id} />
}
