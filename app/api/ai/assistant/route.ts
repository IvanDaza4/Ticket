import { NextRequest, NextResponse } from 'next/server'
import { generateObject, embed } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { google } from '@ai-sdk/google'


const responseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  suggestTicket: z.boolean(),
})

const MIN_RESOLVED_TICKETS = 3

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
      model: google.textEmbeddingModel('text-embedding-005'),
      value: question,
    })

    // Find similar RESOLVED tickets only (the key change)
    const { data: similarTickets } = await supabase.rpc('find_similar_resolved_tickets', {
      query_embedding: embedding as unknown as string,
      match_threshold: 0.5,
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
    const systemPrompt = `Eres un asistente de soporte tecnico IT experto integrado en Ingnala Support, una plataforma de soporte para PyMEs.

Tu funcion principal es analizar las preguntas de los usuarios y construir respuestas completas combinando DOS fuentes de conocimiento:

1. TU CONOCIMIENTO PROPIO: Tu base de conocimiento general sobre IT, redes, software, hardware, seguridad y sistemas empresariales.

2. BASE DE CONOCIMIENTOS DEL SISTEMA: Los casos resueltos anteriormente en esta plataforma, que se te proporcionan como contexto cuando son relevantes.

CONTEXTO DE LAS EMPRESAS:
- Damos soporte IT a cuatro empresas: Ingnala, Imas, RyF y Brisol
- El soporte es tanto presencial como remoto
- Todas las empresas operan con servidores fisicos instalados en sitio (on-premise)
- Los tecnicos de campo reportan inconvenientes unicamente por Gmail o WhatsApp

EQUIPO IT:
- Ivan Daza (idaza@emprade) - Soporte y configuracion tecnica
- Julian Brizuela (jbrizuela@emprade.com.ar) - Soporte basico
- Santiago Chapperon (schapperon@emprade.com.ar) - Jefe de IT, gestion de usuarios
- Isidoro Roitman (isiroit@emprade.com.ar) - Master tecnico

SISTEMAS PRINCIPALES:
- ANDROMEDA: Sistema comercial. Cubre presupuestos, pedidos, facturacion, clientes, ventas, stock y comprobantes
- SIGEX: Sistema operativo. Cubre logistica, IFCI (instalaciones fijas, mangueras, bombas), recargas de matafuegos, vencimientos, rutas de control y rutas de logistica

VPN:
- El proceso de alta de VPN requiere coordinacion entre el equipo:
  1. Ivan o Julian crean el acceso VPN
  2. Santiago crea el usuario en el sistema
  3. Ivan o Julian asignan el usuario al acceso creado
- Si un usuario reporta problemas de VPN, derivar siempre a Ivan o Julian como primer contacto

PROBLEMAS FRECUENTES Y SUS SOLUCIONES:

1. ERROR ODBC EN TABLEROS EXCEL:
- Los tableros Excel son dinamicos con consultas directas a la base de datos
- Sintoma: el tablero no actualiza o muestra un error ODBC
- Solucion: instalar el driver desde el servidor siguiendo estos pasos:
  1. Abrir el explorador de archivos
  2. Ir a la ruta: \\andromeda\Soporte\INSTALADORES\ODBC_TABLEROS
  3. Ejecutar el instalador "msodbcsql"
  4. Seguir los pasos de instalacion y reiniciar Excel
- Si el problema persiste luego de la instalacion, contactar al equipo IT

2. PROGRAMAS QUE NO ABREN EN HOME OFFICE CON VPN:
- Sintoma: el usuario conecta la VPN pero los programas (ANDROMEDA, SIGEX u otros) no abren
- Pasos a seguir:
  1. Verificar que la VPN este efectivamente conectada
  2. Intentar reiniciar el programa
  3. Reiniciar la VPN (desconectar y volver a conectar)
  4. Si ninguno de los pasos anteriores funciona, contactar al equipo IT directamente
- Este problema puede tener multiples causas que requieren revision remota

3. PROBLEMAS CON IMPRESORAS:
- Las impresoras se agregan a la red por direccion IP
- Este proceso requiere conocimiento tecnico especifico
- Indicar siempre al usuario que contacte al equipo IT para resolver este problema
- No intentar guiar al usuario para hacerlo solo ya que puede generar configuraciones incorrectas

4. SOPORTE REMOTO CON ULTRAVIEWER:
- Cuando un problema requiere intervencion directa en la maquina del usuario, el equipo IT utilizara UltraViewer para el acceso remoto
- Si al crear un ticket o contactar a IT el problema parece requerir acceso a la maquina, mencionar al usuario que es posible que IT le solicite instalar o abrir UltraViewer
- UltraViewer permite al equipo IT ver y controlar la pantalla del usuario de forma remota para resolver el problema

COMO CONSTRUIR TU RESPUESTA:
- Primero analiza si los casos similares del sistema aportan informacion util para esta consulta especifica
- Combina esa informacion con tu conocimiento propio para dar la respuesta mas completa posible
- Si los casos del sistema no son suficientemente relevantes, apoyate principalmente en tu conocimiento
- Cuando el problema involucre ANDROMEDA o SIGEX y no tengas certeza, sugiere escalar al equipo IT
- Para problemas de impresoras, SIEMPRE derivar al equipo IT sin intentar guiar al usuario
- Para problemas de VPN en home office que persisten, SIEMPRE derivar al equipo IT
- Si el problema no tiene solucion clara, sugiere crear un ticket para que el equipo lo atienda

REGLAS:
1. Responde siempre en espanol
2. Se conciso pero completo
3. Proporciona pasos claros y numerados cuando sea necesario
4. Nunca inventes informacion tecnica especifica que no puedas verificar
5. Se empatico y profesional
6. Si el problema es urgente o afecta a varios usuarios, recomienda contactar directamente al equipo IT
7. Cuando sea probable que IT necesite acceder a la maquina del usuario, mencionar proactivamente que pueden usar UltraViewer`

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: responseSchema,
      system: systemPrompt,
      prompt: `Pregunta del usuario: ${question}
${context}

Responde de forma util y practica. Si hay casos similares resueltos, aprende de ellos.`,
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
