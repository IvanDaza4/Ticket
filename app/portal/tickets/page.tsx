import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PlusCircle, Search, Filter, Clock } from 'lucide-react'
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, TICKET_URGENCY_LABELS, TICKET_URGENCY_COLORS } from '@/lib/constants'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile to find organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user?.id)
    .single()

  // Get all tickets for user's organization
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      subject,
      status,
      urgency,
      impact,
      support_level,
      priority_score,
      created_at,
      updated_at,
      sla_response_deadline,
      sla_resolution_deadline,
      assignee:profiles!tickets_assigned_to_fkey(first_name, last_name)
    `)
    .eq('organization_id', profile?.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Mis Tickets
          </h1>
          <p className="text-muted-foreground">
            Gestiona y realiza seguimiento de tus tickets de soporte
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/tickets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tickets..." className="pl-9" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Todos los Tickets</CardTitle>
          <CardDescription>
            {tickets?.length || 0} tickets en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link 
                  key={ticket.id} 
                  href={`/portal/tickets/${ticket.id}`}
                  className="block p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-muted-foreground">
                          #{ticket.ticket_number}
                        </span>
                        <Badge variant="secondary" className={TICKET_STATUS_COLORS[ticket.status]}>
                          {TICKET_STATUS_LABELS[ticket.status]}
                        </Badge>
                        <Badge variant="outline" className={TICKET_URGENCY_COLORS[ticket.urgency]}>
                          {TICKET_URGENCY_LABELS[ticket.urgency]}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-foreground mb-1 line-clamp-1">
                        {ticket.subject}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.created_at).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {ticket.assignee && (
                          <span>
                            Asignado a: {(ticket.assignee as { first_name: string; last_name: string }).first_name} {(ticket.assignee as { first_name: string; last_name: string }).last_name}
                          </span>
                        )}
                        <span className="uppercase text-xs">
                          {ticket.support_level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Prioridad</p>
                        <p className="font-semibold">{ticket.priority_score}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No hay tickets</h3>
              <p className="text-muted-foreground mb-4">
                Aún no has creado ningún ticket de soporte.
              </p>
              <Button asChild>
                <Link href="/portal/tickets/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear primer ticket
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
