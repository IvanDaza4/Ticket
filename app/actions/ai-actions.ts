'use server'

import { generateText, Output, embed } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

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
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      output: Output.object({ schema: classificationSchema }),
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
      model: 'openai/text-embedding-3-small',
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
      model: 'openai/text-embedding-3-small',
      value: `${subject}\n\n${description}`,
    })

    const supabase = await createClient()

    // Find similar resolved tickets using vector similarity
    const { data: similarTickets, error: searchError } = await supabase
      .rpc('find_similar_tickets', {
        query_embedding: embedding as unknown as string,
        match_threshold: 0.65,
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
    const prompt = `Eres un técnico experto en soporte IT. Analiza el siguiente ticket y sugiere una solución basada en tu conocimiento y los casos similares resueltos anteriormente.

TICKET ACTUAL:
Asunto: ${subject}
Descripción: ${description}
${context}

Genera una sugerencia de solución detallada y práctica. Si hay casos similares, aprende de las soluciones que funcionaron. Si no hay casos similares, usa tu conocimiento general de IT.

Responde en español con pasos claros y accionables.`

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      output: Output.object({ schema: solutionSchema }),
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
        model: 'openai/text-embedding-3-small',
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
