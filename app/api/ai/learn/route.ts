import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Embedding deshabilitado - modelo no disponible en esta API key
  return NextResponse.json({ success: true })
}