'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface MessageBadgeProps {
  className?: string
}

export function MessageBadge({ className }: MessageBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

    // fetchUnreadCount defined INSIDE useEffect so it's always in scope
    async function fetchUnreadCount(userId: string) {
      if (!isMounted) return

      try {
        const { data: participations } = await supabase
          .from('internal_conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId)

        if (!participations || participations.length === 0) {
          if (isMounted) setUnreadCount(0)
          return
        }

        const convIds = participations.map(p => p.conversation_id)

        const { count } = await supabase
          .from('internal_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .neq('sender_id', userId)
          .eq('is_read', false)

        if (isMounted) setUnreadCount(count || 0)
      } catch {
        // silently ignore — badge is non-critical
      }
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isMounted) return

      const userId = user.id

      // Initial fetch
      await fetchUnreadCount(userId)

      // Poll every 10s
      intervalId = setInterval(() => fetchUnreadCount(userId), 10000)

      // Realtime subscription — build channel BEFORE subscribe, chain both .on() calls
      channel = supabase
        .channel(`unread-messages-${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'internal_messages' },
          () => fetchUnreadCount(userId)
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'internal_messages' },
          () => fetchUnreadCount(userId)
        )
        .subscribe()
    }

    init()

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
      if (channel) supabase.removeChannel(channel)
    }
  }, []) // empty deps — runs once on mount

  if (unreadCount === 0) return null

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium',
        className
      )}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}