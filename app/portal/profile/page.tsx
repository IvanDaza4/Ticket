'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { User, Mail, Phone, Building2, Briefcase, Save, Loader2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfileData {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  job_title: string | null
  department: string | null
  avatar_url: string | null
  organization?: {
    name: string
  } | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
    department: '',
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        job_title,
        department,
        avatar_url,
        organization:organizations(name)
      `)
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setProfile(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        job_title: data.job_title || '',
        department: data.department || '',
      })
    }
    setLoading(false)
  }

  async function saveProfile() {
    if (!profile) return

    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        phone: formData.phone || null,
        job_title: formData.job_title || null,
        department: formData.department || null,
      })
      .eq('id', profile.id)

    setSaving(false)

    if (!error) {
      setSaved(true)
      fetchProfile()
      setTimeout(() => setSaved(false), 3000)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Mi Perfil
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu informacion personal y preferencias
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {formData.first_name?.[0]}{formData.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {formData.first_name} {formData.last_name}
              </CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
              {profile?.organization && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {profile.organization.name}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informacion Personal</CardTitle>
          <CardDescription>
            Actualiza tu informacion de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="pl-9"
                  placeholder="Tu nombre"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellidos</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="pl-9"
                  placeholder="Tus apellidos"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="pl-9 bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              El email no se puede modificar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-9"
                placeholder="+34 612 345 678"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title">Cargo</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="pl-9"
                  placeholder="Director, Manager, etc."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="pl-9"
                  placeholder="IT, Ventas, Marketing, etc."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            {saved && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Guardado correctamente
              </div>
            )}
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>
            Acciones irreversibles de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Cerrar Sesion</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar sesion?</AlertDialogTitle>
                <AlertDialogDescription>
                  Seras redirigido a la pagina de inicio. Podras volver a iniciar sesion en cualquier momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Cerrar Sesion
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
