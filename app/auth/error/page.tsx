import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, Headset } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Headset className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">Ingnala</span>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Error de Autenticación</CardTitle>
          <CardDescription>
            Ha ocurrido un error durante el proceso de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esto puede deberse a un enlace expirado o inválido. Por favor, intenta iniciar sesión nuevamente.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Si el problema persiste, contacta con el administrador del sistema.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              Volver a Iniciar Sesión
            </Link>
          </Button>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            Volver al inicio
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
