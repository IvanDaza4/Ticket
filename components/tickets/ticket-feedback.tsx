'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, X, Loader2, CheckCircle2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TicketFeedbackProps {
  ticketId: string
  ticketNumber: string
  onFeedbackSubmitted?: () => void
  onClose?: () => void
}

export function TicketFeedback({ ticketId, ticketNumber, onFeedbackSubmitted, onClose }: TicketFeedbackProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const ratingLabels = [
    '',
    'Muy insatisfecho',
    'Insatisfecho',
    'Neutral',
    'Satisfecho',
    'Muy satisfecho'
  ]

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Por favor selecciona una calificacion')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error: insertError } = await supabase
        .from('ticket_feedback')
        .insert({
          ticket_id: ticketId,
          rating,
          comment: comment.trim() || null,
          created_by: user.id
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Ya has enviado feedback para este ticket')
        } else {
          throw insertError
        }
        return
      }

      setSubmitted(true)
      onFeedbackSubmitted?.()
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setError('Error al enviar el feedback. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseWithoutFeedback = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (error) throw error
      onClose?.()
    } catch (err) {
      console.error('Error closing ticket:', err)
      setError('Error al cerrar el ticket')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Gracias por tu feedback</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Tu opinion nos ayuda a mejorar nuestro servicio
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Tu opinion importa</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleCloseWithoutFeedback}
            disabled={loading}
            title="Cerrar sin calificar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          El ticket #{ticketNumber} ha sido marcado como resuelto. Por favor califica el servicio recibido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Star Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Calificacion</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={loading}
                className={cn(
                  "p-1 transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors duration-150",
                    (hoveredRating || rating) >= value
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
          {(hoveredRating || rating) > 0 && (
            <p className="text-sm text-muted-foreground">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Comentario (opcional)</label>
          <Textarea
            placeholder="Cuentanos mas sobre tu experiencia..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Calificacion'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}