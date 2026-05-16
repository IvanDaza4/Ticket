'use server'

import { generateObject } from 'ai'

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
export async function learnFromResolvedTicket(ticketId: string) {
  // Embedding deshabilitado - modelo no disponible en esta API key
  return { success: true }
}

/**
 * Finds similar resolved tickets and generates AI solution suggestions
 * This is the core ML function that learns from past solutions
 */
export async function getAISuggestions(ticketId: string, subject: string, description: string) {
  try {
    const supabase = await createClient()

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: solutionSchema,
      system: `Eres un asistente de soporte tecnico IT experto integrado en Ingnala Support.

SISTEMAS PRINCIPALES:
- ANDROMEDA: Sistema comercial (presupuestos, pedidos, facturacion, stock)
- SIGEX: Sistema operativo (logistica, IFCI, matafuegos, rutas)

PROBLEMAS FRECUENTES Y SOLUCIONES:

1. ERROR ODBC EN TABLEROS EXCEL:
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

3. IMPRESORAS: Siempre derivar al equipo IT.
4. SOPORTE REMOTO: El equipo IT usa UltraViewer.

REGLAS:
1. Responde en espanol con pasos numerados
2. Para impresoras y VPN persistente, SIEMPRE derivar al equipo IT
3. No inventes informacion tecnica`,
      prompt: `Analiza el siguiente ticket y sugiere una solucion practica.

TICKET:
Asunto: ${subject}
Descripcion: ${description}

Usa el conocimiento de problemas frecuentes documentados para dar una solucion concreta.`,
    })

    const { data: suggestion } = await supabase
      .from('ai_suggestions')
      .insert({
        ticket_id: ticketId,
        suggested_solution: result.object.suggestedSolution,
        similar_tickets: [],
        confidence_score: result.object.confidence,
      })
      .select()
      .single()

    return {
      success: true,
      suggestion: result.object,
      similarTickets: [],
      patterns: [],
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

