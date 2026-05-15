'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Sparkles, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown, 
  Brain, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  History,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AISuggestion {
  suggestedSolution: string
  steps: string[]
  estimatedDifficulty: 'easy' | 'medium' | 'hard'
  relatedPatterns: string[]
  confidence: number
}

interface SimilarTicket {
  ticket_id: string
  similarity: number
  subject: string
  description: string
  resolution_notes: string
  category: string
}

interface AIAssistantProps {
  ticketId: string
  subject: string
  description: string
  onApplySolution?: (solution: string) => void
}

const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  hard: 'bg-red-100 text-red-800 border-red-200',
}

const DIFFICULTY_LABELS = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
}

export function AIAssistant({ ticketId, subject, description, onApplySolution }: AIAssistantProps) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([])
  const [suggestionId, setSuggestionId] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not_helpful' | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [showSimilar, setShowSimilar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getSuggestions = async () => {
    setLoading(true)
    setError(null)
    setFeedbackGiven(null)

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, subject, description }),
      })

      if (!response.ok) {
        throw new Error('Error al obtener sugerencias')
      }

      const data = await response.json()

      if (data.success) {
        setSuggestion(data.suggestion)
        setSimilarTickets(data.similarTickets || [])
        setSuggestionId(data.suggestionId)
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener sugerencias')
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = async (wasHelpful: boolean) => {
    if (!suggestionId) return

    setFeedbackGiven(wasHelpful ? 'helpful' : 'not_helpful')

    try {
      await fetch('/api/ai/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId,
          wasHelpful,
          feedback: feedbackText || undefined,
        }),
      })
    } catch (err) {
      console.error('Error submitting feedback:', err)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          Asistente IA
          <Badge variant="secondary" className="ml-auto font-normal text-xs">
            Machine Learning
          </Badge>
        </CardTitle>
        <CardDescription>
          Sugerencias basadas en tickets similares resueltos anteriormente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestion && !loading && (
          <div className="text-center py-4">
            <Sparkles className="h-12 w-12 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              El sistema analizará tickets similares y generará una sugerencia de solución personalizada
            </p>
            <Button onClick={getSuggestions} className="gap-2">
              <Zap className="h-4 w-4" />
              Obtener Sugerencia IA
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Analizando tickets similares y generando sugerencia...
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestion && (
          <div className="space-y-4">
            {/* Confidence & Difficulty */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confianza:</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${suggestion.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{Math.round(suggestion.confidence * 100)}%</span>
              </div>
              <Badge className={cn('text-xs', DIFFICULTY_COLORS[suggestion.estimatedDifficulty])}>
                {DIFFICULTY_LABELS[suggestion.estimatedDifficulty]}
              </Badge>
            </div>

            {/* Main Suggestion */}
            <div className="bg-background rounded-lg p-4 border">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-3 flex-1">
                  <p className="text-sm">{suggestion.suggestedSolution}</p>
                  
                  {suggestion.steps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Pasos recomendados:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {suggestion.steps.map((step, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {suggestion.relatedPatterns.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {suggestion.relatedPatterns.map((pattern, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Apply Solution Button */}
            {onApplySolution && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const solutionText = `**Solución sugerida por IA:**\n\n${suggestion.suggestedSolution}\n\n**Pasos:**\n${suggestion.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
                  onApplySolution(solutionText)
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Usar esta solución como base
              </Button>
            )}

            {/* Similar Tickets */}
            {similarTickets.length > 0 && (
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowSimilar(!showSimilar)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <History className="h-4 w-4" />
                  Ver {similarTickets.length} tickets similares resueltos
                  {showSimilar ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>
                
                {showSimilar && (
                  <div className="mt-3 space-y-3">
                    {similarTickets.map((ticket) => (
                      <div key={ticket.ticket_id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-medium line-clamp-1">{ticket.subject}</span>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {Math.round(ticket.similarity * 100)}% similar
                          </Badge>
                        </div>
                        {ticket.resolution_notes && (
                          <div className="mt-2 pt-2 border-t border-muted">
                            <p className="text-xs text-muted-foreground mb-1">Solución aplicada:</p>
                            <p className="text-xs line-clamp-3">{ticket.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">
                ¿Fue útil esta sugerencia? Tu feedback mejora el sistema
              </p>
              
              {!feedbackGiven ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => submitFeedback(true)}
                    className="flex-1"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Útil
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => submitFeedback(false)}
                    className="flex-1"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    No útil
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Gracias por tu feedback
                </div>
              )}

              {feedbackGiven === 'not_helpful' && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="¿Cómo podemos mejorar las sugerencias?"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => submitFeedback(false)}
                  >
                    Enviar comentario
                  </Button>
                </div>
              )}
            </div>

            {/* Regenerate */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={getSuggestions}
              className="w-full text-muted-foreground"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Regenerar sugerencia
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
