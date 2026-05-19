'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Search, AlertTriangle, Clock, User, Loader2, Lock } from 'lucide-react'
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, TICKET_URGENCY_LABELS, TICKET_URGENCY_COLORS } from '@/lib/constants'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  status: string
  urgency: string
  support_level: string
  priority_score: number
  is_sla_breached: boolean
  sla_response_deadline: string | null
  sla_resolution_deadline: string | null
  created_at: string
  resolved_at: string | null
  assigned_to: string | null
  organization: { name: string; plan: string } | null
  creator: { first_name: string; last_name: string } | null
  assignee: { first_name: string; last_name: string } | null
}

export default function AdminInboxPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUser()
    fetchTickets()
  }, [])


  async function fetchCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile) {
        setCurrentUserRole(profile.role)
      }
    }
  }

  async function fetchTickets() {
    const { data } = await supabase
      .from('tickets')
      .select(`
        *,
        organization:organizations(name, plan),
        creator:profiles!tickets_created_by_fkey(first_name, last_name),
        assignee:profiles!tickets_assigned_to_fkey(first_name, last_name)
      `)
      .not('status', 'in', '("closed")')
      .order('priority_score', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      setTickets(data as Ticket[])
    }
    setLoading(false)
  }

  const canAccessTicket = (ticket: Ticket) => {
    // Admins can access all tickets
    if (currentUserRole === 'admin') return true
    // Unassigned tickets can be accessed by anyone
    if (!ticket.assigned_to) return true
    // Assigned tickets can only be accessed by the assigned technician
    return ticket.assigned_to === currentUserId
  }
  // Calculate SLA status and apply filters
  const filteredTickets = useMemo(() => {
    const now = new Date()

    return tickets
      .map(ticket => {
        const responseDeadline = ticket.sla_response_deadline ? new Date(ticket.sla_response_deadline) : null
        const resolutionDeadline = ticket.sla_resolution_deadline ? new Date(ticket.sla_resolution_deadline) : null

        let slaStatus: 'green' | 'yellow' | 'red' = 'green'

        if (ticket.is_sla_breached) {
          slaStatus = 'red'
        } else if (resolutionDeadline && !ticket.resolved_at) {
          const totalTime = resolutionDeadline.getTime() - new Date(ticket.created_at).getTime()
          const elapsed = now.getTime() - new Date(ticket.created_at).getTime()
          const percentUsed = elapsed / totalTime

          if (percentUsed >= 1) slaStatus = 'red'
          else if (percentUsed >= 0.75) slaStatus = 'yellow'
        }

        return { ...ticket, slaStatus }
      })
      .filter(ticket => {
        // Search filter
        const matchesSearch = searchQuery === '' ||
          ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())

        // Status filter
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter

        // Urgency filter
        const matchesUrgency = urgencyFilter === 'all' || ticket.urgency === urgencyFilter

        return matchesSearch && matchesStatus && matchesUrgency
      })
  }, [tickets, searchQuery, statusFilter, urgencyFilter])

  const slaColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
          Bandeja de <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Entrada</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Todos los tickets activos ordenados por prioridad
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por asunto, cliente o numero..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="open">Abiertos</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="waiting_client">Esperando Cliente</SelectItem>
                  <SelectItem value="waiting_provider">Esperando Proveedor</SelectItem>
                  <SelectItem value="resolved">Resueltos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Critica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Tickets Activos</CardTitle>
          <CardDescription>
            {loading ? 'Cargando...' : `${filteredTickets.length} tickets en la bandeja`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="space-y-2">
              {filteredTickets.map((ticket) => {
                const hasAccess = canAccessTicket(ticket)
              const isAssignedToOther = ticket.assigned_to && ticket.assigned_to !== currentUserId && currentUserRole !== 'admin'

              const TicketContent = (
              <div
                className={`flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-colors ${hasAccess
                    ? 'border-border hover:bg-muted/50 cursor-pointer'
                    : 'border-border/50 bg-muted/20 opacity-70 cursor-not-allowed'
                  }`}
              >
                {/* SLA Indicator - horizontal on mobile, vertical on desktop */}
                <div className={`h-1 md:h-12 md:w-2 w-full rounded-full ${slaColors[ticket.slaStatus]}`} />

                {/* Ticket Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1">
                    <span className="text-xs md:text-sm font-mono text-muted-foreground">
                      #{ticket.ticket_number}
                    </span>
                    <Badge className={`text-xs ${TICKET_STATUS_COLORS[ticket.status]}`}>
                      {TICKET_STATUS_LABELS[ticket.status]}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${TICKET_URGENCY_COLORS[ticket.urgency]}`}>
                      {TICKET_URGENCY_LABELS[ticket.urgency]}
                    </Badge>
                    <Badge variant="secondary" className="uppercase text-xs hidden sm:inline-flex">
                      {ticket.support_level}
                    </Badge>
                    {ticket.is_sla_breached && (
                      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        SLA
                      </Badge>
                    )}
                    {isAssignedToOther && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs text-muted-foreground border-muted-foreground/30">
                        <Lock className="h-3 w-3" />
                        Asignado
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground line-clamp-1 text-sm md:text-base">
                    {ticket.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span className="truncate max-w-[120px] md:max-w-none">{ticket.organization?.name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="hidden sm:inline">
                      Por: {ticket.creator?.first_name} {ticket.creator?.last_name}
                    </span>
                  </div>
                </div>

                {/* Assignment & Priority */}
                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                  <div>
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${ticket.assigned_to === currentUserId
                            ? 'bg-primary/20'
                            : 'bg-accent/20'
                          }`}>
                          <User className={`h-3.5 w-3.5 md:h-4 md:w-4 ${ticket.assigned_to === currentUserId
                              ? 'text-primary'
                              : 'text-accent'
                            }`} />
                        </div>
                        <span className="text-xs md:text-sm hidden lg:inline">
                          {ticket.assigned_to === currentUserId
                            ? 'Tu'
                            : ticket.assignee?.first_name}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                        Sin asignar
                      </Badge>
                    )}
                  </div>
                  <div className="text-right min-w-[50px] md:min-w-[60px]">
                    <p className="text-xs text-muted-foreground">Prioridad</p>
                    <p className="text-lg md:text-xl font-bold">{ticket.priority_score}</p>
                  </div>
                </div>
              </div>
              )

              return hasAccess ? (
              <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}>
                {TicketContent}
              </Link>
              ) : (
              <div key={ticket.id} title="Este ticket esta asignado a otro tecnico">
                {TicketContent}
              </div>
              )
              })}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-foreground mb-2">
                {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
                  ? 'No se encontraron tickets'
                  : 'Bandeja vacia'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
                  ? 'Intenta ajustar los filtros de busqueda.'
                  : 'No hay tickets activos en este momento.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
