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
    let isMounted = true

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !isMounted) return

      fetchUnreadCount(user.id)
      const interval = setInterval(() => fetchUnreadCount(user.id), 10000)

      const channel = supabase
        .channel(`unread-messages-${user.id}`) // ID único por usuario
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages'
        }, () => fetchUnreadCount(user.id))
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'internal_messages'
        }, () => fetchUnreadCount(user.id))
        .subscribe()

      return () => {
        isMounted = false
        clearInterval(interval)
        supabase.removeChannel(channel)
      }
    }

    const cleanup = init()
    return () => {
      cleanup.then(fn => fn?.())
    }
  }, [])

  return (
    <span className={cn(
      "absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium",
      className
    )}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}
