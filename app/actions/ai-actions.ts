'use server'

import { generateObject, embed } from 'ai'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { google } from '@ai-sdk/google'


// Schema for ticket classification
const classificationSchema = z.object({
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  impact: z.enum(['individual', 'department', 'organization']),
  suggestedCategory: z.string().nullable(),
  reasoning: z.string(),
})

// Schema for AI solution suggestion
const solutionSchema = z.object({
  suggestedSolution: z.string(),
  steps: z.array(z.string()),
  estimatedDifficulty: z.enum(['easy', 'medium', 'hard']),
  relatedPatterns: z.array(z.string()),
  confidence: z.number().min(0).max(1),
})

/**
 * Classifies a ticket using AI - called automatically when ticket is created
 * Returns classification data that is stored with the ticket (not shown to client)
 */
export async function classifyTicket(subject: string, description: string, category?: string) {
  const prompt = `Eres un experto en soporte IT para PyMEs. Analiza el siguiente ticket y clasifícalo según su urgencia e impacto real en el negocio.

TICKET:
Asunto: ${subject}
Descripción: ${description}
${category ? `Categoría seleccionada: ${category}` : ''}

CRITERIOS DE URGENCIA:
- critical: Sistema completamente caído, pérdida de datos activa, seguridad comprometida, toda la empresa afectada
- high: Funcionalidad crítica no disponible, múltiples usuarios bloqueados, deadline urgente
- medium: Problema afecta productividad pero hay workaround, un departamento afectado
- low: Consulta, mejora, problema menor con solución alternativa disponible

CRITERIOS DE IMPACTO:
- organization: Afecta a toda la empresa o sistemas críticos de negocio
- department: Afecta a un departamento o equipo completo
- individual: Afecta solo a un usuario o estación de trabajo

Analiza cuidadosamente el contexto y las palabras clave. Responde en español.`

  try {
    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: classificationSchema,
      prompt,
    })

    return {
      success: true,
      classification: result.object,
    }
  } catch (error) {
    console.error('Error classifying ticket:', error)
    // Default classification if AI fails
    return {
      success: false,
      classification: {
        urgency: 'medium' as const,
        impact: 'individual' as const,
        suggestedCategory: category || null,
        reasoning: 'Clasificación automática no disponible',
      },
    }
  }
}

/**
 * Generates embedding for a ticket's content
 */
export async function generateTicketEmbedding(ticketId: string, subject: string, description: string, resolutionNotes?: string) {
  const content = `${subject}\n\n${description}${resolutionNotes ? `\n\nResolución: ${resolutionNotes}` : ''}`

  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-005'),
      value: content,
    })

    const supabase = await createClient()

    // Create content hash to avoid re-embedding
    const contentHash = Buffer.from(content).toString('base64').slice(0, 64)

    const { error } = await supabase
      .from('ticket_embeddings')
      .upsert({
        ticket_id: ticketId,
        embedding: embedding as unknown as string,
        content_hash: contentHash,
      }, {
        onConflict: 'ticket_id',
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error generating embedding:', error)
    return { success: false, error }
  }
}

/**
 * Finds similar resolved tickets and generates AI solution suggestions
 * This is the core ML function that learns from past solutions
 */
export async function getAISuggestions(ticketId: string, subject: string, description: string) {
  try {
    // Generate embedding for the current ticket
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-005'),
      value: `${subject}\n\n${description}`,
    })

    const supabase = await createClient()

    // Find similar resolved tickets using vector similarity
    const { data: similarTickets, error: searchError } = await supabase
      .rpc('find_similar_tickets', {
        query_embedding: embedding as unknown as string,
        match_threshold: 0.5,
        match_count: 5,
      })

    if (searchError) {
      console.error('Error finding similar tickets:', searchError)
    }

    // Find matching solution patterns
    const { data: patterns } = await supabase
      .rpc('find_solution_patterns', {
        query_embedding: embedding as unknown as string,
        match_count: 3,
      })

    // Build context from similar tickets
    let context = ''
    if (similarTickets && similarTickets.length > 0) {
      context = `\n\nTICKETS SIMILARES RESUELTOS ANTERIORMENTE:\n`
      similarTickets.forEach((ticket: any, index: number) => {
        context += `\n--- Caso ${index + 1} (Similitud: ${Math.round(ticket.similarity * 100)}%) ---\n`
        context += `Problema: ${ticket.subject}\n`
        context += `Descripción: ${ticket.description?.slice(0, 200)}...\n`
        context += `Solución aplicada: ${ticket.resolution_notes}\n`
      })
    }

    // Add patterns context
    if (patterns && patterns.length > 0) {
      context += `\n\nPATRONES DE SOLUCIÓN CONOCIDOS:\n`
      patterns.forEach((pattern: any, index: number) => {
        context += `\n--- Patrón ${index + 1}: ${pattern.pattern_name} ---\n`
        context += `${pattern.pattern_description}\n`
        if (pattern.recommended_steps) {
          context += `Pasos: ${pattern.recommended_steps.join(', ')}\n`
        }
      })
    }

    // Generate AI suggestion based on similar cases
    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: solutionSchema,
      system: `Eres un asistente de soporte tecnico IT experto integrado en Ingnala Support.

CONTEXTO DE LAS EMPRESAS:
- Damos soporte IT a cuatro empresas: Ingnala, Imas, RyF y Brisol
- Servidores fisicos on-premise en cada empresa

EQUIPO IT:
- Ivan Daza (idaza@emprade.com.ar) - Soporte y configuracion tecnica
- Julian Brizuela (jbrizuela@emprade.com.ar) - Soporte basico
- Santiago Chapperon (schapperon@emprade.com.ar) - Jefe de IT
- Isidoro Roitman (isiroit@emprade.com.ar) - Master tecnico

SISTEMAS PRINCIPALES:
- ANDROMEDA: Sistema comercial (presupuestos, pedidos, facturacion, stock)
- SIGEX: Sistema operativo (logistica, IFCI, matafuegos, rutas)

PROBLEMAS FRECUENTES Y SOLUCIONES:

1. ERROR ODBC EN TABLEROS EXCEL:
- Los tableros Excel consultan directamente la base de datos
- Solucion: instalar driver desde el servidor:
  1. Abrir explorador de archivos
  2. Ir a: \\\\andromeda\\Soporte\\INSTALADORES\\ODBC_TABLEROS
  3. Ejecutar "msodbcsql" y seguir los pasos
  4. Reiniciar Excel
- Si persiste, contactar al equipo IT

2. PROGRAMAS QUE NO ABREN CON VPN:
  1. Verificar que la VPN este conectada
  2. Reiniciar el programa
  3. Reconectar la VPN
  4. Si persiste, contactar al equipo IT

3. IMPRESORAS: Siempre derivar al equipo IT, no guiar al usuario.

4. SOPORTE REMOTO: El equipo IT usa UltraViewer para acceso remoto.

REGLAS:
1. Responde en espanol
2. Se conciso con pasos numerados
3. Para impresoras y VPN persistente, SIEMPRE derivar al equipo IT
4. No inventes informacion tecnica`,
      prompt: `Analiza el siguiente ticket y sugiere una solucion practica.

TICKET:
Asunto: ${subject}
Descripcion: ${description}
${context}

Si hay casos similares resueltos, aprende de ellos. Si no, usa el conocimiento de problemas frecuentes documentados.`,
    })


    // Store suggestion in database for learning
    const { data: suggestion, error: insertError } = await supabase
      .from('ai_suggestions')
      .insert({
        ticket_id: ticketId,
        suggested_solution: result.object.suggestedSolution,
        similar_tickets: similarTickets?.map((t: any) => t.ticket_id) || [],
        confidence_score: result.object.confidence,
      })
      .select()
      .single()

    return {
      success: true,
      suggestion: result.object,
      similarTickets: similarTickets || [],
      patterns: patterns || [],
      suggestionId: suggestion?.id,
    }
  } catch (error) {
    console.error('Error getting AI suggestions:', error)
    return {
      success: false,
      error: 'No se pudieron generar sugerencias',
    }
  }
}

/**
 * Records feedback on AI suggestion to improve future suggestions
 */
export async function recordSuggestionFeedback(suggestionId: string, wasHelpful: boolean, feedback?: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('ai_suggestions')
      .update({
        was_helpful: wasHelpful,
        feedback,
      })
      .eq('id', suggestionId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error recording feedback:', error)
    return { success: false }
  }
}

/**
 * Updates solution patterns based on a resolved ticket
 * This is the "learning" part of the unsupervised ML system
 */
export async function learnFromResolvedTicket(ticketId: string) {
  try {
    const supabase = await createClient()

    // Get the resolved ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket || !ticket.resolution_notes) {
      return { success: false, error: 'Ticket not found or not resolved' }
    }

    // Generate embedding including resolution
    await generateTicketEmbedding(
      ticketId,
      ticket.subject,
      ticket.description,
      ticket.resolution_notes
    )

    // Check if this solution was helpful (from AI suggestions)
    const { data: suggestion } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('was_helpful', true)
      .single()

    // If suggestion was helpful, boost confidence in similar patterns
    if (suggestion) {
      // Update usage count for patterns that were used
      const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-005'),
        value: `${ticket.subject}\n\n${ticket.description}\n\nResolución: ${ticket.resolution_notes}`,
      })

      // Find and update similar patterns
      const { data: matchingPatterns } = await supabase
        .rpc('find_solution_patterns', {
          query_embedding: embedding as unknown as string,
          match_count: 1,
        })

      if (matchingPatterns && matchingPatterns.length > 0) {
        await supabase
          .from('solution_patterns')
          .update({
            usage_count: matchingPatterns[0].usage_count + 1,
            success_rate: Math.min(
              (matchingPatterns[0].success_rate * matchingPatterns[0].usage_count + 100) /
              (matchingPatterns[0].usage_count + 1),
              100
            ),
            source_tickets: [...(matchingPatterns[0].source_tickets || []), ticketId],
          })
          .eq('id', matchingPatterns[0].pattern_id)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error learning from ticket:', error)
    return { success: false, error }
  }
}
