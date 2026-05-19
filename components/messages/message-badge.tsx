'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface MessageBadgeProps {
  className?: string
}

export function MessageBadge({ className }: MessageBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let userId: string | null = null
    let subscription: any = null

    async function fetchUnreadCount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      userId = user.id

      // Get all participations with last_read_at
      const { data: participations } = await supabase
        .from('internal_conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)

      if (!participations || participations.length === 0) {
        setUnreadCount(0)
        return
      }

      let total = 0

      for (const p of participations) {
        const { count } = await supabase
          .from('internal_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', p.conversation_id)
          .neq('sender_id', user.id)
          .gt('created_at', p.last_read_at || '1970-01-01')
          .eq('is_read', false)

        total += count || 0
      }

      setUnreadCount(total)
    }

    fetchUnreadCount()

    // Poll every 10 seconds to pick up read status changes
    const interval = setInterval(fetchUnreadCount, 10000)

    // Real-time subscription for new messages
    subscription = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages'
        },
        () => {
          fetchUnreadCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'internal_conversation_participants'
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [supabase])

  if (unreadCount === 0) return null

  return (
    <span className={cn(
      "absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium",
      className
    )}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}
