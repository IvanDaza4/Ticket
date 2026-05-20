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
  AlertTriangle,
  ArrowRight
} from 'lucide-react'
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, TICKET_URGENCY_COLORS } from '@/lib/constants'

export default async function AdminDashboard() {
  const supabase = await createClient()

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

  const { count: orgCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

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
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Panel de <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Administracion</span>
        </h1>
        <p className="text-muted-foreground">
          Vista general del sistema de soporte
        </p>
      </div>

      {/* Alert for critical tickets or SLA breaches */}
      {(stats.critical > 0 || stats.breached > 0) && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 animate-fade-in">
          <div className="p-2 rounded-full bg-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-destructive">Atencion Requerida</p>
            <p className="text-sm text-destructive/80">
              {stats.critical > 0 && `${stats.critical} ticket(s) critico(s) pendiente(s). `}
              {stats.breached > 0 && `${stats.breached} ticket(s) con SLA incumplido.`}
            </p>
          </div>
          <Link 
            href="/admin/inbox?urgency=critical"
            className="text-sm font-medium text-destructive hover:underline flex items-center gap-1 transition-colors duration-200"
          >
            Ver ahora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">Total Tickets</CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                <Ticket className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <span className="text-xl md:text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5 py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">Abiertos</CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
              <span className="text-xl md:text-2xl font-bold">{stats.open}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/5 py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">En Progreso</CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
              </div>
              <span className="text-xl md:text-2xl font-bold">{stats.inProgress}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/5 py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">En Espera</CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              </div>
              <span className="text-xl md:text-2xl font-bold">{stats.waiting}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">Clientes</CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <span className="text-xl md:text-2xl font-bold">{orgCount || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6">
            <CardDescription className="text-xs md:text-sm">Tecnicos</CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-accent/10">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              </div>
              <span className="text-xl md:text-2xl font-bold">{techCount || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tickets por Prioridad</CardTitle>
              <CardDescription>Ordenados por prioridad y fecha de creacion</CardDescription>
            </div>
            <Link 
              href="/admin/inbox" 
              className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTickets && recentTickets.length > 0 ? (
            <div className="space-y-3">
              {recentTickets.map((ticket, index) => (
                <Link 
                  key={ticket.id} 
                  href={`/admin/tickets/${ticket.id}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 animate-slide-up group"
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
                        <Badge variant="destructive" className="animate-pulse">SLA</Badge>
                      )}
                    </div>
                    <p className="font-medium text-foreground truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(ticket.organization as { name: string })?.name} - {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Prioridad</p>
                      <p className="text-lg font-bold text-primary">{ticket.priority_score}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-emerald-500/10 w-fit mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-muted-foreground">No hay tickets pendientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
