'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Send, 
  Loader2, 
  Sparkles, 
  MessageCircle,
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Lightbulb,
  HelpCircle,
  Info,
  AlertTriangle,
  Database
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: string[]
}

const SUGGESTED_QUESTIONS = [
  'Como reinicio mi contrasena?',
  'Por que mi equipo va lento?',
  'No puedo conectarme a la VPN',
  'Como configuro el correo en mi movil?',
  'Mi impresora no funciona',
  'Como comparto archivos con mi equipo?',
]

const MIN_RESOLVED_TICKETS = 10

export default function KnowledgeBasePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(true)
  const [resolvedTicketsCount, setResolvedTicketsCount] = useState<number>(0)
  const [isAvailable, setIsAvailable] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check availability on mount
  useEffect(() => {
    async function checkAvailability() {
      try {
        const { count } = await supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'resolved')

        const resolvedCount = count || 0
        setResolvedTicketsCount(resolvedCount)
        setIsAvailable(resolvedCount >= MIN_RESOLVED_TICKETS)
      } catch (error) {
        console.error('Error checking AI availability:', error)
        setIsAvailable(false)
      } finally {
        setCheckingAvailability(false)
      }
    }

    checkAvailability()
  }, [supabase])

  const handleSubmit = async (question: string) => {
    if (!question.trim() || loading || !isAvailable) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        throw new Error('Error al procesar la consulta')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta de nuevo o crea un ticket de soporte.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  if (checkingAvailability) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando disponibilidad del asistente...</p>
        </div>
      </div>
    )
  }

  if (!isAvailable) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-muted rounded-full mb-4">
            <Brain className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            Asistente de Soporte IA
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            El asistente aun no esta disponible
          </p>
        </div>

        {/* Not Available Card */}
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                <Database className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Asistente en Entrenamiento</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  El asistente de IA necesita aprender de casos resueltos para poder ayudarte de forma efectiva.
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso de entrenamiento</span>
                  <span className="font-medium">{resolvedTicketsCount} / {MIN_RESOLVED_TICKETS} tickets</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((resolvedTicketsCount / MIN_RESOLVED_TICKETS) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Faltan {Math.max(MIN_RESOLVED_TICKETS - resolvedTicketsCount, 0)} tickets resueltos para activar el asistente
                </p>
              </div>

              <Alert className="text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Mientras tanto, puedes crear un ticket de soporte y un tecnico te ayudara personalmente.
                </AlertDescription>
              </Alert>

              <Button asChild className="w-full">
                <Link href="/portal/tickets/new">
                  Crear Ticket de Soporte
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 md:space-y-6 pb-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
          Asistente de Soporte IA
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
          Preguntame cualquier cosa sobre problemas tecnicos. Aprendo de {resolvedTicketsCount} casos resueltos para darte la mejor solucion.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Machine Learning
          </Badge>
          <Badge variant="outline" className="gap-1">
            <MessageCircle className="h-3 w-3" />
            Respuestas instantaneas
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-900">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
          Si la solucion no resuelve tu problema, puedes{' '}
          <Link href="/portal/tickets/new" className="font-semibold underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-300">
            crear un ticket de soporte
          </Link>{' '}
          para que un tecnico te ayude personalmente.
        </AlertDescription>
      </Alert>

      {/* Chat Container */}
      <Card className="min-h-[400px] md:min-h-[500px] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-3 md:p-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 md:p-8">
                <HelpCircle className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/40 mb-4" />
                <h3 className="font-medium text-foreground mb-2">
                  En que puedo ayudarte?
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Describe tu problema o elige una de las preguntas frecuentes
                </p>
                
                {/* Suggested Questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSubmit(question)}
                      disabled={loading}
                      className="flex items-center gap-2 p-3 text-left text-sm rounded-lg border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="line-clamp-2">{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-2 md:gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] md:max-w-[80%] rounded-lg p-3 md:p-4',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">
                            Basado en casos similares resueltos
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">Fue util?</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-accent" />
                      </div>
                    )}
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-2 md:gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 md:p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analizando tu consulta...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(input)
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe tu problema o pregunta..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" className="shrink-0">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CTA to create ticket */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-6">
          <div>
            <h3 className="font-medium text-foreground">No encontraste la solucion?</h3>
            <p className="text-sm text-muted-foreground">
              Crea un ticket y un tecnico te ayudara personalmente
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/portal/tickets/new">
              Crear Ticket
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
