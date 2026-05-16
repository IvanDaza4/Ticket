'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send, Lock, User } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  author: {
    first_name: string
    last_name: string
    role: string
    avatar_url: string | null
  }
}

interface AdminTicketCommentsProps {
  ticketId: string
  comments: Comment[]
}

export function AdminTicketComments({ ticketId, comments }: AdminTicketCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          author_id: user.id,
          content: newComment.trim(),
          is_internal: isInternal
        })

      if (error) throw error

      // If not internal, mark first response
      if (!isInternal) {
        await supabase
          .from('tickets')
          .update({ first_response_at: new Date().toISOString() })
          .eq('id', ticketId)
          .is('first_response_at', null)
      }

      setNewComment('')
      setIsInternal(false)
      router.refresh()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'technician':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-primary/20 text-primary border-primary/30'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'technician':
        return 'Técnico'
      default:
        return 'Cliente'
    }
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay comentarios aún
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`flex gap-3 p-4 rounded-lg border transition-all duration-200 ${
                comment.is_internal 
                  ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50' 
                  : 'bg-secondary/50 border-border/60 hover:border-border'
              }`}
            >
              <Avatar className="h-9 w-9 ring-2 ring-border/50">
                <AvatarImage src={comment.author?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">
                    {comment.author?.first_name} {comment.author?.last_name}
                  </span>
                  <Badge variant="secondary" className={getRoleColor(comment.author?.role)}>
                    {getRoleLabel(comment.author?.role)}
                  </Badge>
                  {comment.is_internal && (
                    <Badge variant="outline" className="text-amber-400 border-amber-500/50 bg-amber-500/10">
                      <Lock className="h-3 w-3 mr-1" />
                      Interno
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDistanceToNow(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un comentario..."
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="internal"
              checked={isInternal}
              onCheckedChange={(checked) => setIsInternal(checked as boolean)}
            />
            <Label 
              htmlFor="internal" 
              className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
            >
              <Lock className="h-3 w-3" />
              Nota interna (no visible para el cliente)
            </Label>
          </div>
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </form>
    </div>
  )
}
