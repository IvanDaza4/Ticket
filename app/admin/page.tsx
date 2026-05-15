import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Building2, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, TICKET_URGENCY_COLORS } from '@/lib/constants'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get ticket statistics
  const { data: allTickets } = await supabase
    .from('tickets')
    .select('id, status, urgency, is_sla_breached')

  const { data: recentTickets } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      subject,
      status,
      urgency,
      priority_score,
      created_at,
      is_sla_breached,
      organization:organizations(name)
    `)
    .order('priority_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  // Get organization count
  const { count: orgCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get technician count
  const { count: techCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['technician', 'admin'])
    .eq('is_active', true)

  const stats = {
    total: allTickets?.length || 0,
    open: allTickets?.filter(t => t.status === 'open').length || 0,
    inProgress: allTickets?.filter(t => t.status === 'in_progress').length || 0,
    waiting: allTickets?.filter(t => ['waiting_client', 'waiting_provider'].includes(t.status)).length || 0,
    resolved: allTickets?.filter(t => ['resolved', 'closed'].includes(t.status)).length || 0,
    breached: allTickets?.filter(t => t.is_sla_breached).length || 0,
    critical: allTickets?.filter(t => t.urgency === 'critical' && !['resolved', 'closed'].includes(t.status)).length || 0,
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Panel de Administración
        </h1>
        <p className="text-muted-foreground">
          Vista general del sistema de soporte
        </p>
      </div>

      {/* Alert for critical tickets or SLA breaches */}
      {(stats.critical > 0 || stats.breached > 0) && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Atención Requerida</p>
            <p className="text-sm text-destructive/80">
              {stats.critical > 0 && `${stats.critical} ticket(s) crítico(s) pendiente(s). `}
              {stats.breached > 0 && `${stats.breached} ticket(s) con SLA incumplido.`}
            </p>
          </div>
          <Link 
            href="/admin/inbox?urgency=critical"
            className="text-sm font-medium text-destructive hover:underline"
          >
            Ver ahora
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
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
              <span className="text-2xl font-bold">{stats.open}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Progreso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.inProgress}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Espera</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.waiting}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{orgCount || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Técnicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">{techCount || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tickets por Prioridad</CardTitle>
              <CardDescription>Ordenados por prioridad y fecha de creación</CardDescription>
            </div>
            <Link 
              href="/admin/inbox" 
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTickets && recentTickets.length > 0 ? (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <Link 
                  key={ticket.id} 
                  href={`/admin/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-muted-foreground">
                        #{ticket.ticket_number}
                      </span>
                      <Badge className={TICKET_STATUS_COLORS[ticket.status]}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </Badge>
                      <Badge variant="outline" className={TICKET_URGENCY_COLORS[ticket.urgency]}>
                        {ticket.urgency}
                      </Badge>
                      {ticket.is_sla_breached && (
                        <Badge variant="destructive">SLA</Badge>
                      )}
                    </div>
                    <p className="font-medium text-foreground truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(ticket.organization as { name: string })?.name} • {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-muted-foreground">Prioridad</p>
                    <p className="text-lg font-bold">{ticket.priority_score}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No hay tickets pendientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
