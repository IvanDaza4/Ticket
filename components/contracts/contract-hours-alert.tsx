'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractHoursAlertProps {
  organizationId: string
  className?: string
}

interface HoursData {
  contracted_hours: number
  hours_used: number
  hours_remaining: number
  percentage_used: number
}

export function ContractHoursAlert({ organizationId, className }: ContractHoursAlertProps) {
  const [data, setData] = useState<HoursData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHours() {
      const supabase = createClient()

      // Get contract for organization
      const { data: contract } = await supabase
        .from('contracts')
        .select('monthly_hours')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single()

      if (!contract) {
        setLoading(false)
        return
      }

      // Get hours used this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const endOfMonth = new Date(startOfMonth)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)

      const { data: timeEntries } = await supabase
        .from('ticket_time_entries')
        .select('hours, tickets!inner(organization_id)')
        .eq('tickets.organization_id', organizationId)
        .gte('entry_date', startOfMonth.toISOString().split('T')[0])
        .lt('entry_date', endOfMonth.toISOString().split('T')[0])

      const hoursUsed = timeEntries?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0
      const hoursRemaining = Math.max(0, contract.monthly_hours - hoursUsed)
      const percentageUsed = contract.monthly_hours > 0 
        ? (hoursUsed / contract.monthly_hours) * 100 
        : 0

      setData({
        contracted_hours: contract.monthly_hours,
        hours_used: hoursUsed,
        hours_remaining: hoursRemaining,
        percentage_used: percentageUsed
      })
      setLoading(false)
    }

    fetchHours()
  }, [organizationId])

  if (loading || !data) return null

  // Don't show if plenty of hours remaining (more than 30%)
  if (data.percentage_used < 70) return null

  const isExceeded = data.hours_remaining <= 0
  const isWarning = data.percentage_used >= 90 && !isExceeded
  const isNotice = data.percentage_used >= 70 && data.percentage_used < 90

  return (
    <Alert 
      className={cn(
        "border-2",
        isExceeded && "border-destructive bg-destructive/10",
        isWarning && "border-orange-500 bg-orange-50 dark:bg-orange-950/20",
        isNotice && "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
        className
      )}
    >
      {isExceeded ? (
        <AlertTriangle className="h-5 w-5 text-destructive" />
      ) : isWarning ? (
        <AlertTriangle className="h-5 w-5 text-orange-500" />
      ) : (
        <Clock className="h-5 w-5 text-amber-500" />
      )}
      <AlertTitle className={cn(
        isExceeded && "text-destructive",
        isWarning && "text-orange-700 dark:text-orange-400",
        isNotice && "text-amber-700 dark:text-amber-400"
      )}>
        {isExceeded 
          ? 'Horas contratadas agotadas'
          : isWarning 
            ? 'Pocas horas disponibles'
            : 'Aviso de horas'
        }
      </AlertTitle>
      <AlertDescription className={cn(
        "text-sm mt-1",
        isExceeded && "text-destructive/90",
        isWarning && "text-orange-600 dark:text-orange-300",
        isNotice && "text-amber-600 dark:text-amber-300"
      )}>
        {isExceeded ? (
          <>
            Has utilizado <strong>{data.hours_used.toFixed(1)} horas</strong> de las{' '}
            <strong>{data.contracted_hours} horas</strong> contratadas este mes.
            El soporte adicional puede generar cargos extra segun tu contrato.
          </>
        ) : (
          <>
            Has utilizado <strong>{data.hours_used.toFixed(1)} horas</strong> de las{' '}
            <strong>{data.contracted_hours} horas</strong> contratadas este mes.
            Te quedan <strong>{data.hours_remaining.toFixed(1)} horas</strong> disponibles.
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}