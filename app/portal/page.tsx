import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Ticket, Clock, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, TICKET_URGENCY_COLORS } from '@/lib/constants'

export default async function PortalDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, first_name')
    .eq('id', user?.id)
    .single()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, status, urgency, subject, created_at, ticket_number')
    .eq('organization_id', profile?.organization_id)
    .order('created_at', { ascending: false })
    .limit(5)

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
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Bienvenido, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{profile?.first_name || 'Usuario'}</span>
          </h1>
          <p className="text-muted-foreground">
            Aqui tienes un resumen de tus tickets de soporte.
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5">
          <Link href="/portal/tickets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Ticket
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-2">
            <CardDescription>Total Tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Abiertos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-3xl font-bold">{stats.open}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription>En Progreso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Loader2 className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-3xl font-bold">{stats.inProgress}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Resueltos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-3xl font-bold">{stats.resolved}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tickets Recientes</CardTitle>
              <CardDescription>Tus ultimos tickets de soporte</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="hover:bg-primary/10 hover:border-primary/30 transition-colors duration-200">
              <Link href="/portal/tickets">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket, index) => (
                <Link 
                  key={ticket.id} 
                  href={`/portal/tickets/${ticket.id}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 animate-slide-up group"
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-4" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <Ticket className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">No tienes tickets aun</p>
              <Button asChild className="bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25">
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
