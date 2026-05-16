import { generateText, Output } from 'ai'
import { z } from 'zod'
import { google } from '@ai-sdk/google'


const ticketClassificationSchema = z.object({
  urgency: z.enum(['low', 'medium', 'high', 'critical']).describe(
    'La urgencia del ticket basándose en el impacto temporal: low = puede esperar días, medium = necesita resolución pronto pero no es bloqueante, high = afecta significativamente el trabajo y necesita atención urgente, critical = sistema caído o parada total de operaciones'
  ),
  impact: z.enum(['individual', 'department', 'organization']).describe(
    'El alcance del problema: individual = afecta solo a una persona, department = afecta a un equipo o departamento, organization = afecta a toda la empresa o sistemas críticos'
  ),
  reasoning: z.string().describe('Breve explicación del por qué se asignó esta urgencia e impacto'),
  suggestedCategory: z.string().nullable().describe('Categoría sugerida si no fue proporcionada por el usuario'),
})

export async function POST(req: Request) {
  try {
    const { subject, description, category } = await req.json()

    if (!subject || !description) {
      return Response.json(
        { error: 'Asunto y descripción son requeridos' },
        { status: 400 }
      )
    }

    const prompt = `Eres un sistema experto de clasificación de tickets de soporte IT para PyMEs. Tu trabajo es analizar tickets de soporte y determinar su urgencia e impacto de manera objetiva y consistente.

CONTEXTO DE LA EMPRESA:
- Es una empresa de servicios de soporte IT
- Los clientes son pequeñas y medianas empresas
- Los tickets pueden ser sobre hardware, software, redes, seguridad, etc.

CRITERIOS DE URGENCIA:
- LOW (Baja): Consultas generales, mejoras de bajo impacto, problemas estéticos, solicitudes que pueden esperar varios días
- MEDIUM (Media): Problemas que afectan la productividad pero hay workarounds, lentitud del sistema, funcionalidades secundarias no funcionando
- HIGH (Alta): Problemas que bloquean trabajo importante, múltiples usuarios afectados, sistemas de producción degradados, sin workaround razonable
- CRITICAL (Crítica): Sistema completamente caído, pérdida de datos, problemas de seguridad activos, toda la empresa parada

CRITERIOS DE IMPACTO:
- INDIVIDUAL: Solo afecta a un usuario específico
- DEPARTMENT: Afecta a un equipo, departamento o grupo de usuarios
- ORGANIZATION: Afecta a toda la empresa, sistemas críticos compartidos, o infraestructura central

INFORMACIÓN DEL TICKET:
Asunto: ${subject}
Descripción: ${description}
${category ? `Categoría proporcionada: ${category}` : 'Categoría: No proporcionada'}

Analiza cuidadosamente el ticket y proporciona tu clasificación. Sé conservador: no escales a critical/high sin evidencia clara de impacto severo.`

    const { output } = await generateText({
      model: google('gemini-2.0-flash'),
      output: Output.object({
        schema: ticketClassificationSchema,
      }),
      prompt,
    })

    return Response.json({
      classification: output,
    })
  } catch (error) {
    console.error('Error classifying ticket:', error)
    return Response.json(
      { error: 'Error al clasificar el ticket' },
      { status: 500 }
    )
  }
}
