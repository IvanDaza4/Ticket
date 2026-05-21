'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Shield,
  Wrench,
  Users,
  UserX,
  UserCog,
  Mail,
  Building2,
  CheckCircle,
  Ticket,
} from 'lucide-react'
import type { Profile, UserRole } from '@/lib/types'

interface UserWithDetails extends Profile {
  has_tickets: boolean
  ticket_count: number
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  technician: 'Tecnico',
  client: 'Cliente',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  technician: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  client: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

const ROLE_ICON_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-500/10 text-purple-400',
  technician: 'bg-blue-500/10 text-blue-400',
  client: 'bg-emerald-500/10 text-emerald-400',
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'admin' | 'technician' | 'client' | 'unassigned'>('all')
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('client')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`*, organization:organizations(name)`)
      .order('created_at', { ascending: false })

    if (error) { setLoading(false); return }

    const usersWithDetails: UserWithDetails[] = await Promise.all(
      (profiles || []).map(async (user) => {
        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
        return { ...user, has_tickets: (count || 0) > 0, ticket_count: count || 0 }
      })
    )

    setUsers(usersWithDetails)
    setLoading(false)
  }

  const handleEditRole = (user: UserWithDetails) => {
    setEditingUser(user)
    setNewRole(user.role)
  }

  const handleSaveRole = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', editingUser.id)
      if (error) throw error
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u))
      setEditingUser(null)
    } catch (error) {
      console.error('Error updating role:', error)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      !searchQuery ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    switch (selectedCategory) {
      case 'admin': return user.role === 'admin'
      case 'technician': return user.role === 'technician'
      case 'client': return user.role === 'client'
      case 'unassigned': return user.role === 'client' && !user.has_tickets
      default: return true
    }
  })

  const counts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    technician: users.filter(u => u.role === 'technician').length,
    client: users.filter(u => u.role === 'client').length,
    unassigned: users.filter(u => u.role === 'client' && !u.has_tickets).length,
  }

  const CategoryCard = ({ category, title, icon: Icon, color }: {
    category: 'admin' | 'technician' | 'client' | 'unassigned'
    title: string
    icon: React.ElementType
    color: string
  }) => (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-border/50 bg-card/50 backdrop-blur-sm py-3 md:py-6 gap-2 md:gap-6 ${selectedCategory === category ? 'ring-2 ring-primary border-primary/50' : 'hover:border-primary/30'}`}
      onClick={() => setSelectedCategory(category)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
        <CardTitle className="text-xs md:text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 md:p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <span className="text-xl md:text-2xl font-bold">{counts[category]}</span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          <span className="text-foreground">Gestion de </span>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Usuarios</span>
        </h1>
        <p className="text-muted-foreground">Administra los usuarios del sistema y sus roles</p>
      </div>

      {/* KPI Cards — 2 col on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <CategoryCard category="admin" title="Administradores" icon={Shield} color="bg-purple-500/10 text-purple-500" />
        <CategoryCard category="technician" title="Tecnicos" icon={Wrench} color="bg-blue-500/10 text-blue-500" />
        <CategoryCard category="client" title="Clientes" icon={Users} color="bg-emerald-500/10 text-emerald-500" />
        <CategoryCard category="unassigned" title="Sin Asignar" icon={UserX} color="bg-amber-500/10 text-amber-500" />
      </div>

      {/* Search */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="shrink-0"
            >
              Ver Todos ({counts.all})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            {selectedCategory === 'all' ? 'Todos los Usuarios' :
              selectedCategory === 'unassigned' ? 'Clientes Sin Tickets' :
                ROLE_LABELS[selectedCategory as UserRole] + 's'}
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay usuarios</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? 'No se encontraron resultados' : 'No hay usuarios en esta categoria'}
              </p>
            </div>
          ) : (
            /* Mobile: cards grid, Desktop: list */
            <>
              {/* Mobile Cards */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-secondary/30"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 ring-2 ring-border/50 shrink-0">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className={`text-sm font-semibold ${ROLE_ICON_COLORS[user.role]}`}>
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant="outline" className={`${ROLE_COLORS[user.role]} text-xs shrink-0`}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </div>

                    {/* Info row */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
                      <div className="flex items-center gap-3">
                        {user.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {(user.organization as { name: string }).name}
                          </span>
                        )}
                        {user.role === 'client' && (
                          <span className="flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            {user.ticket_count} ticket{user.ticket_count !== 1 ? 's' : ''}
                          </span>
                        )}
                        {user.role === 'client' && !user.has_tickets && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                            Sin Tickets
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRole(user)}
                        className="h-7 text-xs px-2"
                      >
                        Cambiar Rol
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop List */}
              <div className="hidden sm:flex flex-col gap-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 ring-2 ring-border/50">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{user.first_name} {user.last_name}</span>
                          <Badge variant="outline" className={ROLE_COLORS[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                          {user.role === 'client' && !user.has_tickets && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                              Sin Tickets
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          {user.organization && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {(user.organization as { name: string }).name}
                            </span>
                          )}
                          {user.role === 'client' && (
                            <span className="text-xs">{user.ticket_count} ticket{user.ticket_count !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditRole(user)}>
                      Cambiar Rol
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Modifica el rol de {editingUser?.first_name} {editingUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
              <Avatar className="h-12 w-12">
                <AvatarImage src={editingUser?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {editingUser?.first_name?.[0]}{editingUser?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{editingUser?.first_name} {editingUser?.last_name}</p>
                <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nuevo Rol</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-purple-500" />Administrador</div>
                  </SelectItem>
                  <SelectItem value="technician">
                    <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-500" />Tecnico</div>
                  </SelectItem>
                  <SelectItem value="client">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-emerald-500" />Cliente</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUser?.role !== newRole && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <CheckCircle className="h-4 w-4 text-amber-500" />
                <p className="text-sm text-amber-200">
                  El rol cambiara de <strong>{ROLE_LABELS[editingUser?.role || 'client']}</strong> a <strong>{ROLE_LABELS[newRole]}</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveRole} disabled={saving || editingUser?.role === newRole}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}