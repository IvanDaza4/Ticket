import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Calendar, AlertCircle, MessageSquare, Building2 } from 'lucide-react'
import { 
  TICKET_STATUS_LABELS, 
  TICKET_STATUS_COLORS, 
  TICKET_URGENCY_LABELS, 
  TICKET_URGENCY_COLORS,
  TICKET_IMPACT_LABELS,
  SUPPORT_LEVEL_LABELS,
  PLAN_LABELS,
  PLAN_COLORS
} from '@/lib/constants'
import { AdminTicketActions } from '@/components/tickets/admin-ticket-actions'
import { AdminTicketComments } from '@/components/tickets/admin-ticket-comments'
import { AIAssistantWrapper } from '@/components/tickets/ai-assistant-wrapper'

interface AdminTicketDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminTicketDetailPage({ params }: AdminTicketDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get ticket details
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      organization:organizations(id, name, plan, email, phone),
      creator:profiles!tickets_created_by_fkey(id, first_name, last_name, email, phone),
      assignee:profiles!tickets_assigned_to_fkey(id, first_name, last_name, email),
      asset:assets(id, name, asset_type)
    `)
    .eq('id', id)
    .single()

  if (error || !ticket) {
    notFound()
  }

  // Get all comments (including internal)
  const { data: comments } = await supabase
    .from('ticket_comments')
    .select(`
      *,
      author:profiles(first_name, last_name, role, avatar_url)
    `)
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  // Get ticket history
  const { data: history } = await supabase
    .from('ticket_history')
    .select(`
      *,
      changer:profiles(first_name, last_name)
    `)
    .eq('ticket_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get available technicians for assignment
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('role', ['technician', 'admin'])
    .eq('is_active', true)

  // Calculate SLA status
  const now = new Date()
  const responseDeadline = ticket.sla_response_deadline ? new Date(ticket.sla_response_deadline) : null
  const resolutionDeadline = ticket.sla_resolution_deadline ? new Date(ticket.sla_resolution_deadline) : null
  
  const isResponseBreached = responseDeadline && !ticket.first_response_at && now > responseDeadline
  const isResolutionBreached = resolutionDeadline && !ticket.resolved_at && now > resolutionDeadline

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/admin/inbox">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-lg font-mono text-muted-foreground">
              #{ticket.ticket_number}
            </span>
            <Badge className={TICKET_STATUS_COLORS[ticket.status]}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </Badge>
            <Badge variant="outline" className={TICKET_URGENCY_COLORS[ticket.urgency]}>
              {TICKET_URGENCY_LABELS[ticket.urgency]}
            </Badge>
            <Badge variant="secondary" className="uppercase">
              {ticket.support_level}
            </Badge>
            {ticket.is_sla_breached && (
              <Badge variant="destructive">SLA Incumplido</Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {ticket.subject}
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <AdminTicketActions 
            ticket={ticket}
            technicians={technicians || []}
          />

          {/* AI Assistant */}
          <AIAssistantWrapper
            ticketId={ticket.id}
            subject={ticket.subject}
            description={ticket.description}
          />

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comunicación
              </CardTitle>
              <CardDescription>
                Historial de comunicación (incluye notas internas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminTicketComments 
                ticketId={ticket.id} 
                comments={comments || []} 
              />
            </CardContent>
          </Card>

          {/* History */}
          {history && history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Cambios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2" />
                      <div className="flex-1">
                        <p className="text-foreground">
                          <span className="font-medium">
                            {(entry.changer as { first_name: string; last_name: string })?.first_name} {(entry.changer as { first_name: string; last_name: string })?.last_name}
                          </span>{' '}
                          cambió <span className="font-medium">{entry.field_name}</span>{' '}
                          {entry.old_value && (
                            <>de <span className="text-muted-foreground">{entry.old_value}</span>{' '}</>
                          )}
                          a <span className="text-accent">{entry.new_value}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-foreground">
                  {(ticket.organization as { name: string })?.name}
                </p>
                <Badge className={PLAN_COLORS[(ticket.organization as { plan: string })?.plan] || ''}>
                  {PLAN_LABELS[(ticket.organization as { plan: string })?.plan] || (ticket.organization as { plan: string })?.plan}
                </Badge>
              </div>
              {(ticket.organization as { email: string })?.email && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground">{(ticket.organization as { email: string })?.email}</p>
                </div>
              )}
              {(ticket.organization as { phone: string })?.phone && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Teléfono</p>
                  <p className="text-foreground">{(ticket.organization as { phone: string })?.phone}</p>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contacto</p>
                <p className="text-sm font-medium">
                  {(ticket.creator as { first_name: string; last_name: string })?.first_name} {(ticket.creator as { first_name: string; last_name: string })?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{(ticket.creator as { email: string })?.email}</p>
                {(ticket.creator as { phone: string })?.phone && (
                  <p className="text-xs text-muted-foreground">{(ticket.creator as { phone: string })?.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge className={TICKET_STATUS_COLORS[ticket.status]}>
                  {TICKET_STATUS_LABELS[ticket.status]}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Urgencia</span>
                <Badge variant="outline" className={TICKET_URGENCY_COLORS[ticket.urgency]}>
                  {TICKET_URGENCY_LABELS[ticket.urgency]}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Impacto</span>
                <span className="text-sm font-medium">{TICKET_IMPACT_LABELS[ticket.impact]}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nivel</span>
                <span className="text-sm font-medium uppercase">{ticket.support_level}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prioridad</span>
                <span className="text-lg font-bold">{ticket.priority_score}</span>
              </div>
              {ticket.category && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Categoría</span>
                    <span className="text-sm font-medium capitalize">{ticket.category}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Asignación</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.assignee ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {(ticket.assignee as { first_name: string; last_name: string })?.first_name} {(ticket.assignee as { first_name: string; last_name: string })?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{(ticket.assignee as { email: string })?.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sin asignar</p>
              )}
            </CardContent>
          </Card>

          {/* SLA Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                SLA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Respuesta</span>
                  {isResponseBreached ? (
                    <Badge variant="destructive">Incumplido</Badge>
                  ) : ticket.first_response_at ? (
                    <Badge className="bg-green-100 text-green-800">Cumplido</Badge>
                  ) : (
                    <Badge variant="outline">Pendiente</Badge>
                  )}
                </div>
                {responseDeadline && !ticket.first_response_at && (
                  <p className="text-xs text-muted-foreground">
                    Límite: {responseDeadline.toLocaleString('es-ES')}
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Resolución</span>
                  {isResolutionBreached ? (
                    <Badge variant="destructive">Incumplido</Badge>
                  ) : ticket.resolved_at ? (
                    <Badge className="bg-green-100 text-green-800">Cumplido</Badge>
                  ) : (
                    <Badge variant="outline">Pendiente</Badge>
                  )}
                </div>
                {resolutionDeadline && !ticket.resolved_at && (
                  <p className="text-xs text-muted-foreground">
                    Límite: {resolutionDeadline.toLocaleString('es-ES')}
                  </p>
                )}
              </div>
              {ticket.sla_pause_duration_minutes > 0 && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tiempo pausado: </span>
                    <span className="font-medium">{Math.round(ticket.sla_pause_duration_minutes / 60)}h {ticket.sla_pause_duration_minutes % 60}m</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>{new Date(ticket.created_at).toLocaleString('es-ES')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actualizado</span>
                <span>{new Date(ticket.updated_at).toLocaleString('es-ES')}</span>
              </div>
              {ticket.first_response_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primera respuesta</span>
                  <span>{new Date(ticket.first_response_at).toLocaleString('es-ES')}</span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resuelto</span>
                  <span>{new Date(ticket.resolved_at).toLocaleString('es-ES')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
