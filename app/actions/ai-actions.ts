'use server'

import { generateObject } from 'ai'
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

async function callClaude(systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`)
  const data = await response.json()
  return data.content[0]?.text ?? ''
}

/**
 * Classifies a ticket using AI - called automatically when ticket is created
 */
export async function classifyTicket(subject: string, description: string, category?: string) {
  const systemPrompt = `Eres un experto en soporte IT para PyMEs. Analiza el siguiente ticket y clasifícalo.
Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{"urgency":"low|medium|high|critical","impact":"individual|department|organization","suggestedCategory":"string o null","reasoning":"string"}

CRITERIOS DE URGENCIA:
- critical: Sistema completamente caído, pérdida de datos activa, seguridad comprometida
- high: Funcionalidad crítica no disponible, múltiples usuarios bloqueados
- medium: Problema afecta productividad pero hay workaround
- low: Consulta, mejora, problema menor

CRITERIOS DE IMPACTO:
- organization: Afecta a toda la empresa o sistemas críticos
- department: Afecta a un departamento o equipo
- individual: Afecta solo a un usuario`

  const userPrompt = `Asunto: ${subject}
Descripción: ${description}
${category ? `Categoría seleccionada: ${category}` : ''}`

  try {
    const text = await callClaude(systemPrompt, userPrompt)
    const parsed = JSON.parse(text.trim())
    const result = classificationSchema.parse(parsed)
    return { success: true, classification: result }
  } catch (error) {
    console.error('Error classifying ticket:', error)
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
 * Generates embedding for a ticket's content (disabled)
 */
export async function learnFromResolvedTicket(ticketId: string) {
  return { success: true }
}

/**
 * Finds similar resolved tickets and generates AI solution suggestions
 */
export async function getAISuggestions(ticketId: string, subject: string, description: string) {
  try {
    const supabase = await createClient()

    const systemPrompt = `Eres un asistente de soporte tecnico IT experto integrado en NOVA Support.

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
3. No inventes informacion tecnica

Responde ÚNICAMENTE con un JSON válido con esta estructura (sin markdown):
{"suggestedSolution":"string","steps":["string"],"estimatedDifficulty":"easy|medium|hard","relatedPatterns":["string"],"confidence":0.0}`

    const userPrompt = `Analiza el siguiente ticket y sugiere una solucion practica.

TICKET:
Asunto: ${subject}
Descripcion: ${description}

Usa el conocimiento de problemas frecuentes documentados para dar una solucion concreta.`

    const text = await callClaude(systemPrompt, userPrompt)
    const parsed = JSON.parse(text.trim())
    const result = solutionSchema.parse(parsed)

    const { data: suggestion } = await supabase
      .from('ai_suggestions')
      .insert({
        ticket_id: ticketId,
        suggested_solution: result.suggestedSolution,
        similar_tickets: [],
        confidence_score: result.confidence,
      })
      .select()
      .single()

    return {
      success: true,
      suggestion: result,
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
 * Records feedback on AI suggestion
 */
export async function recordSuggestionFeedback(suggestionId: string, wasHelpful: boolean, feedback?: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('ai_suggestions')
      .update({ was_helpful: wasHelpful, feedback })
      .eq('id', suggestionId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error recording feedback:', error)
    return { success: false }
  }
}