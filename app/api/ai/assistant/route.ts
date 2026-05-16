import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
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
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { count: resolvedCount } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')

    if (!resolvedCount || resolvedCount < MIN_RESOLVED_TICKETS) {
      return NextResponse.json({
        answer: `El asistente de IA aun no esta disponible. Necesitamos al menos ${MIN_RESOLVED_TICKETS} tickets resueltos. Actualmente hay ${resolvedCount || 0}. Por favor, crea un ticket de soporte para que un tecnico te ayude directamente.`,
        suggestTicket: true,
      })
    }

    const systemPrompt = `Eres un asistente de soporte tecnico IT experto integrado en Ingnala Support, una plataforma de soporte para PyMEs.

CONTEXTO DE LAS EMPRESAS:
- Damos soporte IT a cuatro empresas: Ingnala, Imas, RyF y Brisol
- El soporte es tanto presencial como remoto
- Todas las empresas operan con servidores fisicos instalados en sitio (on-premise)
- Los tecnicos de campo reportan inconvenientes unicamente por Gmail o WhatsApp

EQUIPO IT:
- Ivan Daza (idaza@emprade.com.ar) - Soporte y configuracion tecnica
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
  2. Ir a la ruta: \\\\andromeda\\Soporte\\INSTALADORES\\ODBC_TABLEROS
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

3. PROBLEMAS CON IMPRESORAS:
- Las impresoras se agregan a la red por direccion IP
- Indicar siempre al usuario que contacte al equipo IT
- No intentar guiar al usuario para hacerlo solo

4. SOPORTE REMOTO CON ULTRAVIEWER:
- El equipo IT utiliza UltraViewer para acceso remoto
- Si el problema requiere acceso a la maquina, mencionar que IT puede solicitar UltraViewer

REGLAS:
1. Responde siempre en espanol
2. Se conciso pero completo
3. Proporciona pasos claros y numerados cuando sea necesario
4. Nunca inventes informacion tecnica especifica
5. Se empatico y profesional
6. Para impresoras y VPN persistente, SIEMPRE derivar al equipo IT
7. Mencionar UltraViewer cuando el problema requiera acceso remoto`

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: responseSchema,
      system: systemPrompt,
      prompt: `Pregunta del usuario: ${question}

Responde de forma util y practica basandote en el conocimiento del sistema.`,
    })

    return NextResponse.json({
      answer: result.object.answer,
      suggestTicket: result.object.suggestTicket,
    })
  } catch (error) {
    console.error('Error in AI assistant:', error)
    return NextResponse.json({
      answer: 'Lo siento, estoy teniendo problemas para procesar tu consulta. Por favor, intenta de nuevo o crea un ticket de soporte.',
      suggestTicket: true,
    })
  }
}