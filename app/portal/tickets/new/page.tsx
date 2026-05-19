'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Send, Sparkles, ImagePlus, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { TICKET_CATEGORIES } from '@/lib/constants'
import Image from 'next/image'
import { ContractHoursAlert } from '@/components/contracts/contract-hours-alert'


interface AttachedImage {
  id: string
  file: File
  preview: string
}

export default function NewTicketPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<AttachedImage[]>([])
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
  })

  const supabase = createClient()

  // Fetch organization ID on mount
  useEffect(() => {
    async function fetchOrganization() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (profile?.organization_id) {
          setOrganizationId(profile.organization_id)
        }
      }
    }
    fetchOrganization()
  }, [supabase])

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: AttachedImage[] = []

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = crypto.randomUUID()
        const preview = URL.createObjectURL(file)
        newImages.push({ id, file, preview })
      }
    })

    setImages(prev => [...prev, ...newImages])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const toRemove = prev.find(img => img.id === id)
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Por favor, completa el asunto y la descripción')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('No estás autenticado')
      }

      // Get user profile to get organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) {
        setError('No tienes una organización asignada. Contacta al administrador para que te asigne una.')
        setLoading(false)
        return
      }

      // Get organization plan
      const { data: organization } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', profile.organization_id)
        .single()

      // Call AI classification API - the result is NOT shown to the user
      const classificationResponse = await fetch('/api/classify-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          category: formData.category || null,
        }),
      })

      let classification = {
        urgency: 'medium' as const,
        impact: 'individual' as const,
        reasoning: 'Clasificación por defecto',
      }

      if (classificationResponse.ok) {
        const classificationData = await classificationResponse.json()
        classification = classificationData.classification
      }

      // Get SLA definition for this ticket based on AI classification
      const { data: slaDefinition } = await supabase
        .from('sla_definitions')
        .select('response_time_minutes, resolution_time_minutes')
        .eq('plan', organization?.plan || 'bronze')
        .eq('urgency', classification.urgency)
        .eq('impact', classification.impact)
        .single()

      // Calculate SLA deadlines
      const now = new Date()
      const slaResponseDeadline = slaDefinition
        ? new Date(now.getTime() + slaDefinition.response_time_minutes * 60000).toISOString()
        : null
      const slaResolutionDeadline = slaDefinition
        ? new Date(now.getTime() + slaDefinition.resolution_time_minutes * 60000).toISOString()
        : null

      // Upload images if any
      const attachments: { name: string; url: string; type: string }[] = []

      for (const image of images) {
        const fileName = `${profile.organization_id}/${crypto.randomUUID()}-${image.file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, image.file)

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(uploadData.path)

          attachments.push({
            name: image.file.name,
            url: urlData.publicUrl,
            type: image.file.type,
          })
        }
      }

      // Create the ticket - classification is stored but NOT visible to client
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          organization_id: profile.organization_id,
          created_by: user.id,
          subject: formData.subject,
          description: formData.description,
          urgency: classification.urgency,
          impact: classification.impact,
          category: formData.category || null,
          sla_response_deadline: slaResponseDeadline,
          sla_resolution_deadline: slaResolutionDeadline,
          tags: [`ai_reasoning:${classification.reasoning}`], // Store AI reasoning in tags for technicians
        })
        .select('id')
        .single()

      if (ticketError) throw ticketError

      // If we have attachments, add a comment with them
      if (attachments.length > 0) {
        await supabase
          .from('ticket_comments')
          .insert({
            ticket_id: ticket.id,
            author_id: user.id,
            content: 'Archivos adjuntos al ticket:',
            attachments: attachments,
            is_internal: false,
          })
      }

      // Add internal comment with AI classification (only visible to staff)
      await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          author_id: user.id,
          content: `**Clasificación automática por IA:**\n\n- **Urgencia:** ${classification.urgency}\n- **Impacto:** ${classification.impact}\n- **Razonamiento:** ${classification.reasoning}`,
          is_internal: true, // Only visible to staff
        })

      // Trigger AI learning process (generate embedding for future similarity search)
      fetch('/api/ai/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          subject: formData.subject,
          description: formData.description,
        }),
      }).catch(() => { }) // Fire and forget

      // Clean up image previews
      images.forEach(img => URL.revokeObjectURL(img.preview))

      router.push(`/portal/tickets/${ticket.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el ticket')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.subject.trim() && formData.description.trim()

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/portal/tickets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Nuevo Ticket de Soporte
          </h1>
          <p className="text-muted-foreground">
            Describe tu incidencia y nuestro equipo te ayudará lo antes posible
          </p>
        </div>
      </div>

      {/* AI Badge */}
      <Alert className="bg-primary/5 border-primary/20">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          Nuestro sistema utiliza <strong>Inteligencia Artificial</strong> para analizar y priorizar tu ticket automáticamente, asegurando una respuesta rápida y eficiente.
        </AlertDescription>
      </Alert>
      
       {/* Contract Hours Alert */}
      {organizationId && (
        <ContractHoursAlert organizationId={organizationId} />
      )}
      
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Ticket</CardTitle>
          <CardDescription>
            Proporciona los detalles de tu incidencia. Cuanta más información incluyas, más rápido podremos ayudarte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Asunto *</Label>
              <Input
                id="subject"
                placeholder="Resumen breve del problema (ej: No puedo acceder al correo)"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                disabled={loading}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.subject.length}/200 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe el problema con el mayor detalle posible:&#10;&#10;- ¿Qué estabas haciendo cuando ocurrió?&#10;- ¿Aparece algún mensaje de error?&#10;- ¿Cuántos usuarios están afectados?&#10;- ¿Desde cuándo ocurre?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                disabled={loading}
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si no estás seguro, déjalo en blanco y lo asignaremos nosotros
              </p>
            </div>

            {/* Image Attachments */}
            <div className="space-y-2">
              <Label>Capturas de pantalla (opcional)</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageAdd}
                  className="hidden"
                  id="image-upload"
                />

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                          <Image
                            src={img.preview}
                            alt={img.file.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {img.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Añadir capturas de pantalla
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Las imágenes ayudan a entender mejor el problema
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/portal/tickets">Cancelar</Link>
              </Button>
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando ticket...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Crear Ticket
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              <Sparkles className="h-3 w-3 inline mr-1" />
              La prioridad será asignada automáticamente por nuestro sistema de IA
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
