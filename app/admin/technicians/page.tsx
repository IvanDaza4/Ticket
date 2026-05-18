'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Users, Wrench, Star, Ticket } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface TechnicianWithStats extends Profile {
  open_tickets: number
  resolved_this_month: number
  avg_resolution_time: number
  specialties: string[]
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<TechnicianWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteError, setInviteError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchTechnicians()
  }, [])

  async function fetchTechnicians() {
    // Get technicians and admins
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['technician', 'admin'])
      .order('first_name')

    if (error) {
      setLoading(false)
      return
    }

    // Get ticket stats for each technician
    const techsWithStats: TechnicianWithStats[] = await Promise.all(
      (profiles || []).map(async (tech) => {
        // Get open tickets count
        const { count: openCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', tech.id)
          .in('status', ['open', 'in_progress', 'waiting_client', 'waiting_provider'])

        // Get resolved this month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count: resolvedCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', tech.id)
          .in('status', ['resolved', 'closed'])
          .gte('resolved_at', startOfMonth.toISOString())

        // Get specialties
        const { data: specialties } = await supabase
          .from('technician_specialties')
          .select('specialty')
          .eq('profile_id', tech.id)

        return {
          ...tech,
          open_tickets: openCount || 0,
          resolved_this_month: resolvedCount || 0,
          avg_resolution_time: 0,
          specialties: specialties?.map((s) => s.specialty) || [],
        }
      })
    )

    setTechnicians(techsWithStats)
    setLoading(false)
  }

  async function inviteTechnician() {
    if (!inviteEmail.trim()) return

    setInviteLoading(true)
    setInviteError('')
    setInviteMessage('')

    try {
      const response = await fetch('/api/technician-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        setInviteError(data.error || 'Failed to send invitation')
      } else {
        setInviteMessage(`Invitacion enviada a ${inviteEmail}. El tecnico tendra 7 dias para aceptarla.`)
        setInviteEmail('')
        setTimeout(() => {
          setIsInviteOpen(false)
          setInviteMessage('')
        }, 2000)
      }
    } catch (error) {
      setInviteError('Error sending invitation. Please try again.')
      console.error('Error:', error)
    } finally {
      setInviteLoading(false)
    }
  }

  const filteredTechs = technicians.filter(
    (tech) =>
      tech.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: technicians.length,
    active: technicians.filter((t) => t.is_active).length,
    totalOpenTickets: technicians.reduce((sum, t) => sum + t.open_tickets, 0),
    totalResolvedMonth: technicians.reduce(
      (sum, t) => sum + t.resolved_this_month,
      0
    ),
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Tecnicos</span></h1>
          <p className="text-muted-foreground">
            Gestiona el equipo de soporte tecnico
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invitar Tecnico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Tecnico</DialogTitle>
              <DialogDescription>
                Envia una invitacion por email para unirse al equipo. Tendran 7 dias para aceptarla.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {inviteMessage && (
                <div className="p-3 rounded-lg bg-green-50 text-green-800 text-sm">
                  {inviteMessage}
                </div>
              )}
              {inviteError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">
                  {inviteError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="tecnico@ingnala.com"
                  disabled={inviteLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsInviteOpen(false)}
                disabled={inviteLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={inviteTechnician} 
                disabled={!inviteEmail || inviteLoading}
              >
                {inviteLoading ? 'Enviando...' : 'Enviar Invitacion'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tecnicos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tickets Abiertos
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOpenTickets}</div>
            <p className="text-xs text-muted-foreground">asignados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resueltos Este Mes
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResolvedMonth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio por Tecnico
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0
                ? Math.round(stats.totalResolvedMonth / stats.total)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">tickets/mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tecnicos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Technicians Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredTechs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay tecnicos</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No se encontraron resultados'
                : 'Invita al primer tecnico para empezar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTechs.map((tech) => (
            <Card key={tech.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={tech.avatar_url || undefined} />
                    <AvatarFallback>
                      {tech.first_name?.[0]}
                      {tech.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {tech.first_name} {tech.last_name}
                      </h3>
                      <Badge
                        variant={tech.is_active ? 'default' : 'secondary'}
                      >
                        {tech.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tech.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {tech.role === 'admin' ? 'Administrador' : 'Tecnico'}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-2xl font-bold">{tech.open_tickets}</p>
                    <p className="text-xs text-muted-foreground">
                      Tickets abiertos
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {tech.resolved_this_month}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Resueltos este mes
                    </p>
                  </div>
                </div>

                {tech.specialties.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Especialidades
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tech.specialties.map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.location.href = `/admin/technicians/${tech.id}`}
                  >
                    Ver Perfil
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.location.href = `/admin/inbox?assign=${tech.id}`}
                  >
                    Asignar Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
