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

      // Collect all conversation IDs for a single batch query
      const convIds = participations.map(p => p.conversation_id)

      const { count: total } = await supabase
        .from('internal_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .neq('sender_id', user.id)
        .eq('is_read', false)

      setUnreadCount(total || 0)
    }

    fetchUnreadCount()

    // Poll every 10 seconds to pick up read status changes
    const interval = setInterval(fetchUnreadCount, 10000)

    // Real-time: react to new messages AND to messages being marked as read
    subscription = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_messages' },
        () => { fetchUnreadCount() }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'internal_messages' },
        () => { fetchUnreadCount() }
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
