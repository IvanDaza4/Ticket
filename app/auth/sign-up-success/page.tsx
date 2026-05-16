import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Headset, Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Headset className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">NOVA</span>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">¡Registro Exitoso!</CardTitle>
          <CardDescription>
            Tu cuenta ha sido creada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="h-5 w-5" />
            <p className="text-sm">
              Hemos enviado un correo de confirmación a tu dirección de email.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace de confirmación para activar tu cuenta.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              Ir a Iniciar Sesión
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
