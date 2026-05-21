'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Search, Ticket, AlertTriangle, Clock, CheckCircle, ExternalLink, Building2, User,
} from 'lucide-react'
import type { Ticket as TicketType, TicketStatus, TicketUrgency } from '@/lib/types'

interface TicketWithRelations extends TicketType {
  organization?: { name: string; plan: string }
  creator?: { first_name: string; last_name: string }
  assignee?: { first_name: string; last_name: string }
}

const statusLabels: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  waiting_client: 'Esperando Cliente',
  waiting_provider: 'Esperando Proveedor',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

const statusColors: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  waiting_client: 'bg-purple-100 text-purple-800 border-purple-200',
  waiting_provider: 'bg-orange-100 text-orange-800 border-orange-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
}

const urgencyLabels: Record<TicketUrgency, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Critica',
}

const urgencyColors: Record<TicketUrgency, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => { fetchTickets() }, [])

  async function fetchTickets() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`*, organization:organizations(name, plan), creator:profiles!tickets_created_by_fkey(first_name, last_name), assignee:profiles!tickets_assigned_to_fkey(first_name, last_name)`)
      .order('created_at', { ascending: false })
    if (!error && data) setTickets(data)
    setLoading(false)
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_number?.toString().includes(searchQuery) ||
      ticket.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch &&
      (statusFilter === 'all' || ticket.status === statusFilter) &&
      (urgencyFilter === 'all' || ticket.urgency === urgencyFilter)
  })

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => ['open', 'in_progress', 'waiting_client', 'waiting_provider'].includes(t.status)).length,
    slaBreach: tickets.filter(t => t.is_sla_breached).length,
    resolvedToday: tickets.filter(t => {
      if (!t.resolved_at) return false
      const today = new Date(); today.setHours(0, 0, 0, 0)
      return new Date(t.resolved_at) >= today
    }).length,
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Todos los <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Tickets</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">Vista completa de todos los tickets del sistema</p>
      </div>

      {/* KPI Cards — 2 col on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Abiertos</CardTitle>
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">SLA Incumplido</CardTitle>
            <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-red-600">{stats.slaBreach}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Resueltos Hoy</CardTitle>
            <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] md:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.keys(statusLabels) as TicketStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[130px] md:w-[150px]">
                  <SelectValue placeholder="Urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {(Object.keys(urgencyLabels) as TicketUrgency[]).map(u => (
                    <SelectItem key={u} value={u}>{urgencyLabels[u]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay tickets</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
                  ? 'No se encontraron resultados con los filtros aplicados'
                  : 'No hay tickets en el sistema'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}>
                    <div className={`flex flex-col gap-3 p-4 rounded-xl border transition-colors hover:bg-muted/30 ${ticket.is_sla_breached ? 'border-red-500/40 bg-red-500/5' : 'border-border/50'}`}>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-mono text-xs text-muted-foreground">#{ticket.ticket_number}</span>
                          <p className="font-medium text-sm text-foreground line-clamp-2">{ticket.subject}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                          {statusLabels[ticket.status]}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${urgencyColors[ticket.urgency]}`}>
                          {urgencyLabels[ticket.urgency]}
                        </Badge>
                        {ticket.is_sla_breached && (
                          <Badge variant="destructive" className="text-xs">SLA</Badge>
                        )}
                      </div>

                      {/* Footer info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {ticket.organization?.name || 'Sin org.'}
                          </span>
                          {ticket.assignee && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {ticket.assignee.first_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">P{ticket.priority_score}</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">#</TableHead>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Asignado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Urgencia</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id} className={ticket.is_sla_breached ? 'bg-red-50/50' : ''}>
                        <TableCell className="font-mono text-sm">#{ticket.ticket_number}</TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <div className="font-medium truncate">{ticket.subject}</div>
                            {ticket.is_sla_breached && <Badge variant="destructive" className="mt-1 text-xs">SLA Incumplido</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.organization?.name || 'Sin org.'}</div>
                            <div className="text-xs text-muted-foreground">{ticket.creator?.first_name} {ticket.creator?.last_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.assignee
                            ? <span>{ticket.assignee.first_name} {ticket.assignee.last_name}</span>
                            : <span className="text-muted-foreground">Sin asignar</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={urgencyColors[ticket.urgency]}>{urgencyLabels[ticket.urgency]}</Badge>
                        </TableCell>
                        <TableCell><span className="font-mono">{ticket.priority_score}</span></TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(ticket.created_at).toLocaleDateString('es-ES')}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/tickets/${ticket.id}`}><ExternalLink className="h-4 w-4 mr-1" />Ver</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}