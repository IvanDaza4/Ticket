'use client'

import { useEffect, useState, useId } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface MessageBadgeProps {
  className?: string
}

export function MessageBadge({ className }: MessageBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const uniqueId = useId()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    let subscription: ReturnType<typeof supabase.channel> | null = null

    async function fetchUnreadCount() {
      if (!isMounted) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isMounted) return

      // Get all participations
      const { data: participations } = await supabase
        .from('internal_conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (!participations || participations.length === 0 || !isMounted) {
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

      if (isMounted) {
        setUnreadCount(total || 0)
      }
    }

    fetchUnreadCount()

    // Poll every 10 seconds to pick up read status changes
    const interval = setInterval(fetchUnreadCount, 10000)

    // Real-time: react to new messages AND to messages being marked as read
    // Use a unique channel name per component instance to avoid conflicts
    const channelName = `unread-messages-${uniqueId.replace(/:/g, '-')}`
    subscription = supabase
      .channel(channelName)
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

    subscription.subscribe()

    return () => {
      isMounted = false
      clearInterval(interval)
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [supabase, uniqueId])

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
