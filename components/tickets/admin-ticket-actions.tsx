'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowUpCircle, Play, Pause, CheckCircle } from 'lucide-react'
import {
  TICKET_STATUS_LABELS,
  SUPPORT_LEVEL_LABELS,
} from '@/lib/constants'
import type { TicketStatus, SupportLevel } from '@/lib/types'

interface AdminTicketActionsProps {
  ticket: {
    id: string
    status: TicketStatus
    support_level: SupportLevel
    assigned_to: string | null
    sla_paused_at: string | null
  }
  technicians: Array<{
    id: string
    first_name: string
    last_name: string
  }>
}

export function AdminTicketActions({ ticket, technicians }: AdminTicketActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [autoAssigned, setAutoAssigned] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Auto-assign ticket when technician opens it
  useEffect(() => {
    const autoAssignTicket = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        setCurrentUserId(user.id)

        // Only auto-assign if not already assigned
        if (!ticket.assigned_to) {
          const { error } = await supabase
            .from('tickets')
            .update({
              assigned_to: user.id,
              status: ticket.status === 'open' ? 'in_progress' : ticket.status
            })
            .eq('id', ticket.id)

          if (!error) {
            setAutoAssigned(true)
            router.refresh()
          }
        }
      } catch (error) {
        console.error('Error auto-assigning ticket:', error)
      }
    }

    autoAssignTicket()
  }, [ticket.id, ticket.assigned_to, supabase, router])

  const handleAssign = async (technicianId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: technicianId,
          status: ticket.status === 'open' ? 'in_progress' : ticket.status
        })
        .eq('id', ticket.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error assigning ticket:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (status: TicketStatus) => {
    setIsLoading(true)
    try {
      const updates: Record<string, unknown> = { status }
      
      if (status === 'in_progress' && !ticket.assigned_to && currentUserId) {
        // Auto-assign to current user if not assigned
        updates.assigned_to = currentUserId
      }
      
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString()
        // Keep SLA open until client responds or 48 hours pass
        updates.status = 'resolved'
      }
      
      if (status === 'closed') {
        updates.closed_at = new Date().toISOString()
        // SLA officially closes when ticket is marked as closed
        updates.sla_paused_at = null // Ensure SLA is not paused
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEscalate = async () => {
    setIsLoading(true)
    try {
      const levels: SupportLevel[] = ['n1', 'n2', 'n3']
      const currentIndex = levels.indexOf(ticket.support_level)
      if (currentIndex < levels.length - 1) {
        const { error } = await supabase
          .from('tickets')
          .update({ support_level: levels[currentIndex + 1] })
          .eq('id', ticket.id)

        if (error) throw error
        router.refresh()
      }
    } catch (error) {
      console.error('Error escalating ticket:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSLAPause = async () => {
    setIsLoading(true)
    try {
      if (ticket.sla_paused_at) {
        // Resume SLA
        const pausedAt = new Date(ticket.sla_paused_at)
        const pauseDuration = Math.round((Date.now() - pausedAt.getTime()) / 60000)
        
        const { error } = await supabase.rpc('resume_sla', {
          p_ticket_id: ticket.id,
          p_pause_duration: pauseDuration
        })

        if (error) {
          // Fallback if RPC doesn't exist
          await supabase
            .from('tickets')
            .update({ 
              sla_paused_at: null,
              status: 'in_progress'
            })
            .eq('id', ticket.id)
        }
      } else {
        // Pause SLA
        const { error } = await supabase
          .from('tickets')
          .update({ 
            sla_paused_at: new Date().toISOString(),
            status: 'waiting_client'
          })
          .eq('id', ticket.id)

        if (error) throw error
      }
      router.refresh()
    } catch (error) {
      console.error('Error toggling SLA pause:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3">
          {/* Assign */}
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <Select
              value={ticket.assigned_to || ''}
              onValueChange={handleAssign}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Asignar a..." />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.first_name} {tech.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Change */}
          <Select
            value={ticket.status}
            onValueChange={(value) => handleStatusChange(value as TicketStatus)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Escalate */}
          {ticket.support_level !== 'n3' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEscalate}
              disabled={isLoading}
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Escalar a {SUPPORT_LEVEL_LABELS[ticket.support_level === 'n1' ? 'n2' : 'n3']}
            </Button>
          )}

          {/* Pause/Resume SLA */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSLAPause}
            disabled={isLoading}
          >
            {ticket.sla_paused_at ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Reanudar SLA
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar SLA
              </>
            )}
          </Button>

          {/* Quick Resolve */}
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleStatusChange('resolved')}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolver
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
