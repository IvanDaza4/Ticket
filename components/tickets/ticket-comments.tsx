'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Send, User } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  author: {
    first_name: string
    last_name: string
    role: string
    avatar_url: string | null
  }
}

interface TicketCommentsProps {
  ticketId: string
  comments: Comment[]
}

export function TicketComments({ ticketId, comments: initialComments }: TicketCommentsProps) {
  const router = useRouter()
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('No autenticado')

      const { data: comment, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          author_id: user.id,
          content: newComment.trim(),
          is_internal: false,
        })
        .select(`
          *,
          author:profiles(first_name, last_name, role, avatar_url)
        `)
        .single()

      if (error) throw error

      setComments([...comments, comment])
      setNewComment('')
      router.refresh()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={
                  comment.author.role === 'client' 
                    ? 'bg-muted text-muted-foreground' 
                    : 'bg-accent/20 text-accent'
                }>
                  {comment.author.first_name?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {comment.author.first_name} {comment.author.last_name}
                  </span>
                  {comment.author.role !== 'client' && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                      Soporte
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No hay mensajes aún. Escribe el primer comentario.
        </p>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Escribe un mensaje..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={loading}
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading || !newComment.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
