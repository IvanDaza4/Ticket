'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function ConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md text-center border-border shadow-lg animate-in fade-in zoom-in duration-300">
        <CardHeader className="flex flex-col items-center space-y-2 pb-4">
          <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950/50">
            <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            ¡Cuenta Verificada!
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Tu correo electrónico ha sido confirmado con éxito. Ya tienes acceso completo al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Link
            href="/dashboard" // O la ruta principal de tu app
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Ir al Panel Principal
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}