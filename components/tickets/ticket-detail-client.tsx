'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Calendar, MessageSquare, Loader2, CheckCircle2, PartyPopper } from 'lucide-react'
import {
  TICKET_STATUS_LABELS, TICKET_STATUS_COLORS,
  TICKET_URGENCY_LABELS, TICKET_URGENCY_COLORS, TICKET_IMPACT_LABELS,
} from '@/lib/constants'
import { TicketComments } from '@/components/tickets/ticket-comments'
import { TicketFeedback } from '@/components/tickets/ticket-feedback'
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TicketDetailClientProps {
  ticketId: string
}

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  urgency: string
  impact: string
  support_level: string
  priority_score: number
  category: string | null
  sla_response_deadline: string | null
  sla_resolution_deadline: string | null
  first_response_at: string | null
  resolved_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  resolution_notes: string | null
  organization: { name: string; plan: string } | null
  creator: { first_name: string; last_name: string; email: string } | null
  assignee: { first_name: string; last_name: string; email: string } | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  is_internal: boolean
  author: {
    first_name: string
    last_name: string
    role: string
    avatar_url: string | null
  } | null
}

export function TicketDetailClient({ ticketId }: TicketDetailClientProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)
  const [showResolvedAlert, setShowResolvedAlert] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [hasFeedback, setHasFeedback] = useState(false)

  const supabase = createClient()

  const fetchTicket = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        organization:organizations(name, plan),
        creator:profiles!tickets_created_by_fkey(first_name, last_name, email),
        assignee:profiles!tickets_assigned_to_fkey(first_name, last_name, email)
      `)
      .eq('id', ticketId)
      .single()

    if (!error && data) {
      if (previousStatus && previousStatus !== 'resolved' && data.status === 'resolved') {
        setShowResolvedAlert(true)
        setShowFeedback(true)
      }
      if (data.status === 'resolved' && !hasFeedback) {
        setShowFeedback(true)
      }
      setPreviousStatus(data.status)
      setTicket(data)
    }
  }, [ticketId, previousStatus, hasFeedback, supabase])

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('ticket_comments')
      .select(`*, author:profiles(first_name, last_name, role, avatar_url)`)
      .eq('ticket_id', ticketId)
      .eq('is_internal', false)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }, [ticketId, supabase])

  const checkExistingFeedback = useCallback(async () => {
    // Check in ticket_feedback table
    const { data } = await supabase
      .from('ticket_feedback')
      .select('id')
      .eq('ticket_id', ticketId)
      .maybeSingle()

    if (data) {
      setHasFeedback(true)
      setShowFeedback(false)
    }
  }, [ticketId, supabase])

  useEffect(() => {
    async function loadData() {
      await Promise.all([fetchTicket(), fetchComments(), checkExistingFeedback()])
      setLoading(false)
    }
    loadData()
  }, [fetchTicket, fetchComments, checkExistingFeedback])

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTicket()
      fetchComments()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchTicket, fetchComments])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` },
        (payload) => {
          const newData = payload.new as Ticket
          if (ticket && ticket.status !== 'resolved' && newData.status === 'resolved') {
            setShowResolvedAlert(true)
            setShowFeedback(true)
          }
          setTicket(prev => prev ? { ...prev, ...newData } : null)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ticketId, ticket, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Ticket no encontrado</h3>
          <Button asChild className="mt-4">
            <Link href="/portal/tickets">Volver a Mis Tickets</Link>
          </Button>
        </div>
      </div>
    )
  }

  const now = new Date()
  const responseDeadline = ticket.sla_response_deadline ? new Date(ticket.sla_response_deadline) : null
  const resolutionDeadline = ticket.sla_resolution_deadline ? new Date(ticket.sla_resolution_deadline) : null
  const isResponseBreached = responseDeadline && !ticket.first_response_at && now > responseDeadline
  const isResolutionBreached = resolutionDeadline && !ticket.resolved_at && now > resolutionDeadline

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 pb-8">
      {/* Resolved Alert Dialog */}
      <AlertDialog open={showResolvedAlert} onOpenChange={setShowResolvedAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl">Tu ticket ha sido resuelto</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              El equipo de soporte ha marcado tu ticket <strong>#{ticket.ticket_number}</strong> como resuelto.
              {ticket.resolution_notes && (
                <span className="block mt-2 p-3 bg-muted rounded-lg text-left text-sm">
                  <strong>Notas de resolucion:</strong><br />
                  {ticket.resolution_notes}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="self-start">
          <Link href="/portal/tickets"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-base md:text-lg font-mono text-muted-foreground">
              #{ticket.ticket_number}
            </span>
            <Badge className={TICKET_STATUS_COLORS[ticket.status]}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </Badge>
            <Badge variant="outline" className={TICKET_URGENCY_COLORS[ticket.urgency]}>
              {TICKET_URGENCY_LABELS[ticket.urgency]}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            {ticket.subject}
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Resolution Notes */}
          {ticket.status === 'resolved' && ticket.resolution_notes && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  Solucion Aplicada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-900 dark:text-green-100 whitespace-pre-wrap">
                  {ticket.resolution_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Feedback Form */}
          {showFeedback && ticket.status === 'resolved' && !hasFeedback && (
            <TicketFeedback
              ticketId={ticket.id}
              ticketNumber={ticket.ticket_number}
              onFeedbackSubmitted={() => {
                setHasFeedback(true)
                setShowFeedback(false)
                fetchTicket()
              }}
              onClose={() => {
                setShowFeedback(false)
                fetchTicket()
              }}
            />
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Descripcion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap text-sm md:text-base">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <MessageSquare className="h-5 w-5" />
                Comunicacion
              </CardTitle>
              <CardDescription>
                Historial de comunicacion con el equipo de soporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketComments ticketId={ticket.id} comments={comments} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <span className="text-sm font-bold">{ticket.priority_score}</span>
              </div>
              {ticket.category && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Categoria</span>
                    <span className="text-sm font-medium capitalize">{ticket.category}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Creado por</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {ticket.creator?.first_name} {ticket.creator?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{ticket.creator?.email}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Asignado a</span>
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {ticket.assignee.first_name} {ticket.assignee.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">Tecnico de soporte</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin asignar</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                SLA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Respuesta</span>
                  {isResponseBreached ? (
                    <Badge variant="destructive" className="text-xs">Incumplido</Badge>
                  ) : ticket.first_response_at ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Cumplido</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Pendiente</Badge>
                  )}
                </div>
                {responseDeadline && !ticket.first_response_at && (
                  <p className="text-xs text-muted-foreground">
                    Limite: {responseDeadline.toLocaleString('es-ES')}
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Resolucion</span>
                  {isResolutionBreached ? (
                    <Badge variant="destructive" className="text-xs">Incumplido</Badge>
                  ) : ticket.resolved_at ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Cumplido</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Pendiente</Badge>
                  )}
                </div>
                {resolutionDeadline && !ticket.resolved_at && (
                  <p className="text-xs text-muted-foreground">
                    Limite: {resolutionDeadline.toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
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
              {ticket.closed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cerrado</span>
                  <span>{new Date(ticket.closed_at).toLocaleString('es-ES')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}