'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [invitationValid, setInvitationValid] = useState(false)
  const [invitationError, setInvitationError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setInvitationError('Token not provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/technician-invitations?token=${token}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setEmail(data.email)
          setInvitationValid(true)
        } else {
          setInvitationError(data.error || 'Invalid invitation')
        }
      } catch (err) {
        setInvitationError('Failed to verify invitation')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    verifyInvitation()
  }, [token])

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setVerifying(true)

    if (!password || password !== confirmPassword) {
      setError('Passwords do not match')
      setVerifying(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setVerifying(false)
      return
    }

    if (!firstName || !lastName) {
      setError('First and last name are required')
      setVerifying(false)
      return
    }

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'technician',
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'technician',
            is_active: true,
          })

        if (profileError) throw profileError

        if (token) {
          await fetch('/api/technician-invitations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, status: 'accepted' })
          })
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      console.error(err)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verificando invitacion...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Bienvenido a Ingnala</CardTitle>
          <CardDescription>
            Completa tu registro para acceder al panel de soporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!invitationValid ? (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Invitacion Invalida
                </h3>
                <p className="text-sm text-muted-foreground">
                  {invitationError}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href="/">Volver al inicio</a>
              </Button>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Cuenta Creada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tu cuenta ha sido creada exitosamente. Redirigiendo...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAcceptInvitation} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={verifying}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    placeholder="Perez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={verifying}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={verifying}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={verifying}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Aceptar Invitacion'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}