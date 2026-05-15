'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

interface TechnicianProfile extends Profile {
  open_tickets: number
  resolved_total: number
  avg_resolution_time: number
  specialties: string[]
}

export default function TechnicianProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [technician, setTechnician] = useState<TechnicianProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { id } = await params

        // Get technician profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()

        if (profileError || !profile) {
          setError('Técnico no encontrado')
          setLoading(false)
          return
        }

        // Get open tickets
        const { count: openCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', id)
          .in('status', ['open', 'in_progress', 'waiting_client', 'waiting_provider'])

        // Get resolved total
        const { count: resolvedCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', id)
          .in('status', ['resolved', 'closed'])

        // Get specialties
        const { data: specialties } = await supabase
          .from('technician_specialties')
          .select('specialty')
          .eq('profile_id', id)

        setTechnician({
          ...profile,
          open_tickets: openCount || 0,
          resolved_total: resolvedCount || 0,
          avg_resolution_time: 0,
          specialties: specialties?.map((s) => s.specialty) || [],
        })
        setLoading(false)
      } catch (err) {
        setError('Error al cargar el perfil')
        setLoading(false)
      }
    }

    fetchProfile()
  }, [params, supabase])

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !technician) {
    return (
      <div className="p-6 md:p-8">
        <Button variant="ghost" asChild>
          <Link href="/admin/technicians">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">{error || 'No encontrado'}</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/admin/technicians">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Técnicos
        </Link>
      </Button>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={technician.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {technician.first_name?.[0]}
                {technician.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {technician.first_name} {technician.last_name}
                  </h1>
                  <p className="text-muted-foreground">{technician.job_title}</p>
                </div>
                <Badge variant={technician.is_active ? 'default' : 'secondary'}>
                  {technician.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                {technician.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {technician.email}
                  </div>
                )}
                {technician.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {technician.phone}
                  </div>
                )}
                {technician.department && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    {technician.department}
                  </div>
                )}
                {technician.last_login_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Último acceso: {new Date(technician.last_login_at).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{technician.open_tickets}</div>
            <p className="text-xs text-muted-foreground mt-1">asignados actualmente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Resueltos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{technician.resolved_total}</div>
            <p className="text-xs text-muted-foreground mt-1">en toda su carrera</p>
          </CardContent>
        </Card>
      </div>

      {/* Specialties */}
      {technician.specialties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Especialidades</CardTitle>
            <CardDescription>Áreas de especialización del técnico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {technician.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href={`/admin/inbox?assign=${technician.id}`}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Asignar Tickets
          </Link>
        </Button>
        <Button variant="outline" className="flex-1">
          Enviar Mensaje
        </Button>
      </div>
    </div>
  )
}
