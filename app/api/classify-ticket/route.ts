import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { subject, description, category } = await req.json()

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Asunto y descripción son requeridos' },
        { status: 400 }
      )
    }

    const systemPrompt = `Eres un sistema experto de clasificación de tickets de soporte IT para PyMEs. Tu trabajo es analizar tickets de soporte y determinar su urgencia e impacto de manera objetiva y consistente.

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

Analiza cuidadosamente el ticket y proporciona tu clasificación. Sé conservador: no escales a critical/high sin evidencia clara de impacto severo.

Responde ÚNICAMENTE con JSON válido (sin markdown, sin explicaciones adicionales):
{"urgency":"low|medium|high|critical","impact":"individual|department|organization","reasoning":"string","suggestedCategory":"string o null"}`

    const userPrompt = `INFORMACIÓN DEL TICKET:
Asunto: ${subject}
Descripción: ${description}
${category ? `Categoría proporcionada: ${category}` : 'Categoría: No proporcionada'}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`)

    const data = await response.json()
    const text = data.content[0]?.text ?? ''
    const output = JSON.parse(text.trim())

    return NextResponse.json({ classification: output })
  } catch (error) {
    console.error('Error classifying ticket:', error)
    return NextResponse.json(
      { error: 'Error al clasificar el ticket' },
      { status: 500 }
    )
  }
}