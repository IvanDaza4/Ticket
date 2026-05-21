'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Clock } from 'lucide-react'
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

      // Get active contract for this org
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('monthly_hours')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle() // use maybeSingle to avoid error when no contract exists

      if (contractError || !contract || !contract.monthly_hours) {
        setLoading(false)
        return
      }

      // Date range: current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const endOfMonth = new Date(startOfMonth)
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)

      const startDateStr = startOfMonth.toISOString().split('T')[0]
      const endDateStr = endOfMonth.toISOString().split('T')[0]

      // Query ticket_time_entries joined through tickets to filter by org
      const { data: timeEntries, error: timeError } = await supabase
        .from('ticket_time_entries')
        .select(`
          hours,
          ticket:tickets!inner(organization_id)
        `)
        .eq('ticket.organization_id', organizationId)
        .gte('entry_date', startDateStr)
        .lt('entry_date', endDateStr)

      // If table error (e.g. no entries yet), just show 0 hours used
      const hoursUsed = timeError
        ? 0
        : (timeEntries?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0)

      const hoursRemaining = Math.max(0, contract.monthly_hours - hoursUsed)
      const percentageUsed = contract.monthly_hours > 0
        ? (hoursUsed / contract.monthly_hours) * 100
        : 0

      setData({
        contracted_hours: contract.monthly_hours,
        hours_used: hoursUsed,
        hours_remaining: hoursRemaining,
        percentage_used: percentageUsed,
      })
      setLoading(false)
    }

    fetchHours()
  }, [organizationId])

  // Don't render while loading or if no contract / enough hours remaining
  if (loading || !data) return null
  if (data.percentage_used < 70) return null

  const isExceeded = data.hours_remaining <= 0
  const isWarning = data.percentage_used >= 90 && !isExceeded

  return (
    <Alert
      className={cn(
        'border-2',
        isExceeded && 'border-destructive bg-destructive/10',
        isWarning && 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
        !isExceeded && !isWarning && 'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
        className
      )}
    >
      {isExceeded || isWarning ? (
        <AlertTriangle className={cn('h-5 w-5', isExceeded ? 'text-destructive' : 'text-orange-500')} />
      ) : (
        <Clock className="h-5 w-5 text-amber-500" />
      )}
      <AlertTitle className={cn(
        isExceeded && 'text-destructive',
        isWarning && 'text-orange-700 dark:text-orange-400',
        !isExceeded && !isWarning && 'text-amber-700 dark:text-amber-400'
      )}>
        {isExceeded
          ? 'Horas contratadas agotadas'
          : isWarning
            ? 'Pocas horas disponibles'
            : 'Aviso de horas'}
      </AlertTitle>
      <AlertDescription className={cn(
        'text-sm mt-1',
        isExceeded && 'text-destructive/90',
        isWarning && 'text-orange-600 dark:text-orange-300',
        !isExceeded && !isWarning && 'text-amber-600 dark:text-amber-300'
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