import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Ticket, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, TICKET_URGENCY_COLORS } from '@/lib/constants'

export default async function PortalDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile to find organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, first_name')
    .eq('id', user?.id)
    .single()

  // Get ticket statistics for user's organization
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, status, urgency, subject, created_at, ticket_number')
    .eq('organization_id', profile?.organization_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Count tickets by status
  const { data: statusCounts } = await supabase
    .from('tickets')
    .select('status')
    .eq('organization_id', profile?.organization_id)

  const stats = {
    total: statusCounts?.length || 0,
    open: statusCounts?.filter(t => t.status === 'open').length || 0,
    inProgress: statusCounts?.filter(t => t.status === 'in_progress').length || 0,
    resolved: statusCounts?.filter(t => ['resolved', 'closed'].includes(t.status)).length || 0,
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Bienvenido, {profile?.first_name || 'Usuario'}
          </h1>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de tus tickets de soporte.
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/tickets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-muted-foreground" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Abiertos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold">{stats.open}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Progreso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold">{stats.inProgress}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resueltos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">{stats.resolved}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tickets Recientes</CardTitle>
              <CardDescription>Tus últimos tickets de soporte</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/tickets">Ver Todos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Link 
                  key={ticket.id} 
                  href={`/portal/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{ticket.ticket_number}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TICKET_URGENCY_COLORS[ticket.urgency]}`}>
                        {ticket.urgency}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Creado {new Date(ticket.created_at).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No tienes tickets aún</p>
              <Button asChild>
                <Link href="/portal/tickets/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear tu primer ticket
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
