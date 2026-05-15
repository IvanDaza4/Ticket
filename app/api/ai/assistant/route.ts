import { NextRequest, NextResponse } from 'next/server'
import { generateText, embed, Output } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const responseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  suggestTicket: z.boolean(),
})

const MIN_RESOLVED_TICKETS = 10

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if we have enough resolved tickets
    const { count: resolvedCount } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')

    if (!resolvedCount || resolvedCount < MIN_RESOLVED_TICKETS) {
      return NextResponse.json({
        answer: `El asistente de IA aun no esta disponible. Necesitamos al menos ${MIN_RESOLVED_TICKETS} tickets resueltos para poder aprender y ayudarte de forma efectiva. Actualmente hay ${resolvedCount || 0} tickets resueltos. Por favor, crea un ticket de soporte para que un tecnico te ayude directamente.`,
        suggestTicket: true,
      })
    }

    // Generate embedding for the question to find similar resolved tickets
    const { embedding } = await embed({
      model: 'openai/text-embedding-3-small',
      value: question,
    })

    // Find similar RESOLVED tickets only (the key change)
    const { data: similarTickets } = await supabase.rpc('find_similar_resolved_tickets', {
      query_embedding: embedding as unknown as string,
      match_threshold: 0.6,
      match_count: 5,
    })

    // Build context from similar resolved tickets
    let context = ''
    const sources: string[] = []

    if (similarTickets && similarTickets.length > 0) {
      context = '\n\nCASOS SIMILARES RESUELTOS ANTERIORMENTE:\n'
      similarTickets.forEach((ticket: {
        subject: string
        description: string
        resolution_notes: string
        category: string
        similarity: number
      }, index: number) => {
        context += `\n--- Caso ${index + 1} ---\n`
        context += `Problema: ${ticket.subject}\n`
        context += `Descripcion: ${ticket.description?.slice(0, 200) || 'N/A'}...\n`
        context += `Solucion: ${ticket.resolution_notes || 'No documentada'}\n`
        sources.push(`Caso #${index + 1}: ${ticket.subject.slice(0, 30)}...`)
      })
    }

    // Generate AI response
    const systemPrompt = `Eres un asistente de soporte tecnico IT amigable y profesional para una plataforma de soporte de PyMEs llamada Ingnala Support.

Tu objetivo es ayudar a los usuarios a resolver sus problemas tecnicos de forma rapida y sencilla.

REGLAS:
1. Responde siempre en espanol
2. Se conciso pero completo
3. Proporciona pasos claros y numerados cuando sea necesario
4. Si hay casos similares resueltos, basa tu respuesta en ellos
5. Si no estas seguro o el problema es complejo, sugiere crear un ticket
6. Nunca inventes informacion tecnica especifica
7. Se empatico y profesional

AREAS DE CONOCIMIENTO:
- Problemas de red y conectividad (VPN, WiFi, Internet)
- Correo electronico y Microsoft 365
- Problemas de hardware (impresoras, equipos lentos)
- Software y aplicaciones empresariales
- Seguridad y contrasenas
- Almacenamiento y archivos compartidos

IMPORTANTE: Solo tienes acceso a informacion de tickets que han sido RESUELTOS. No tienes acceso a tickets pendientes o en progreso.`

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt,
      prompt: `Pregunta del usuario: ${question}
${context}

Responde de forma util y practica. Si hay casos similares resueltos, aprende de ellos.`,
      output: Output.object({ schema: responseSchema }),
    })

    return NextResponse.json({
      answer: result.object.answer,
      sources: sources.length > 0 ? sources : undefined,
      suggestTicket: result.object.suggestTicket,
    })
  } catch (error) {
    console.error('Error in AI assistant:', error)
    
    // Fallback response
    return NextResponse.json({
      answer: 'Lo siento, estoy teniendo problemas para procesar tu consulta en este momento. Por favor, intenta de nuevo en unos momentos o crea un ticket de soporte para que un tecnico pueda ayudarte directamente.',
      suggestTicket: true,
    })
  }
}
