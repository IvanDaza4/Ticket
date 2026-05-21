'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Users, Ticket,
  Edit, Save, Loader2, UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import type { Organization, Profile, Contract, PlanTier } from '@/lib/types'

const planColors: Record<PlanTier, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-slate-100 text-slate-800 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const editableFieldClass = "bg-background border-2 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [ticketCount, setTicketCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [editData, setEditData] = useState({
    name: '', legal_name: '', tax_id: '', email: '', phone: '',
    address: '', city: '', plan: 'bronze' as PlanTier, notes: '',
  })
  const supabase = createClient()

  useEffect(() => {
    if (params.id) fetchData()
  }, [params.id])

  async function fetchData() {
    const orgId = params.id as string
    const { data: orgData, error: orgError } = await supabase
      .from('organizations').select('*').eq('id', orgId).single()
    if (orgError || !orgData) { router.push('/admin/clients'); return }

    setOrganization(orgData)
    setEditData({
      name: orgData.name || '', legal_name: orgData.legal_name || '',
      tax_id: orgData.tax_id || '', email: orgData.email || '',
      phone: orgData.phone || '', address: orgData.address || '',
      city: orgData.city || '', plan: orgData.plan, notes: orgData.notes || '',
    })

    const [usersRes, contractsRes, ticketRes, unassignedRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('organization_id', orgId).order('first_name'),
      supabase.from('contracts').select('*').eq('organization_id', orgId).order('start_date', { ascending: false }),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('profiles').select('*').is('organization_id', null).eq('role', 'client').order('first_name'),
    ])

    setUsers(usersRes.data || [])
    setContracts(contractsRes.data || [])
    setTicketCount(ticketRes.count || 0)
    setAllUsers(unassignedRes.data || [])
    setLoading(false)
  }

  async function saveOrganization() {
    if (!organization) return
    setSaving(true)
    const { error } = await supabase.from('organizations').update(editData).eq('id', organization.id)
    setSaving(false)
    if (!error) { setIsEditing(false); fetchData() }
  }

  async function assignUserToOrganization() {
    if (!selectedUserId || !organization) return
    const { error } = await supabase.from('profiles').update({ organization_id: organization.id }).eq('id', selectedUserId)
    if (!error) { setIsAddUserOpen(false); setSelectedUserId(''); fetchData() }
  }

  async function removeUserFromOrganization(userId: string) {
    const { error } = await supabase.from('profiles').update({ organization_id: null }).eq('id', userId)
    if (!error) fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!organization) return null

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0 mt-0.5">
          <Link href="/admin/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">
              {organization.name}
            </h1>
            <Badge variant="outline" className={planColors[organization.plan]}>
              {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
            </Badge>
            <Badge variant={organization.is_active ? 'default' : 'secondary'}>
              {organization.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          {organization.legal_name && (
            <p className="text-sm text-muted-foreground truncate">{organization.legal_name}</p>
          )}
        </div>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={() => isEditing ? saveOrganization() : setIsEditing(true)}
          disabled={saving}
          className="shrink-0"
        >
          {saving ? (
            <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Guardando</>
          ) : isEditing ? (
            <><Save className="mr-1.5 h-4 w-4" />Guardar</>
          ) : (
            <><Edit className="mr-1.5 h-4 w-4" />Editar</>
          )}
        </Button>
      </div>

      {/* KPI Stats — 2x2 grid on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Contratos</CardTitle>
            <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Tickets</CardTitle>
            <Ticket className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{ticketCount}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Plan</CardTitle>
            <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <Badge variant="outline" className={planColors[organization.plan]}>
              {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="info" className="flex-1 sm:flex-none">Informacion</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 sm:flex-none">Usuarios ({users.length})</TabsTrigger>
          <TabsTrigger value="contracts" className="flex-1 sm:flex-none">Contratos ({contracts.length})</TabsTrigger>
        </TabsList>

        {/* INFO TAB */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Datos de la Organizacion</CardTitle>
              <CardDescription>
                Informacion general y de contacto
                {isEditing && <span className="ml-2 text-primary font-medium">— Modo edicion activo</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Nombre Comercial</Label>
                  {isEditing ? (
                    <Input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className={editableFieldClass} />
                  ) : (
                    <p className="text-sm py-1.5 text-foreground">{organization.name || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Razon Social</Label>
                  {isEditing ? (
                    <Input value={editData.legal_name} onChange={e => setEditData({ ...editData, legal_name: e.target.value })} className={editableFieldClass} placeholder="Razón social" />
                  ) : (
                    <p className="text-sm py-1.5 text-foreground">{organization.legal_name || '-'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">CIF/NIF</Label>
                  {isEditing ? (
                    <Input value={editData.tax_id} onChange={e => setEditData({ ...editData, tax_id: e.target.value })} className={editableFieldClass} placeholder="CIF/NIF" />
                  ) : (
                    <p className="text-sm py-1.5 text-foreground">{organization.tax_id || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Plan</Label>
                  {isEditing ? (
                    <Select value={editData.plan} onValueChange={(v: PlanTier) => setEditData({ ...editData, plan: v })}>
                      <SelectTrigger className={editableFieldClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="py-1.5">
                      <Badge variant="outline" className={planColors[organization.plan]}>
                        {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</Label>
                  {isEditing ? (
                    <Input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className={editableFieldClass} placeholder="correo@empresa.com" />
                  ) : (
                    <p className="text-sm py-1.5 text-foreground">{organization.email || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Telefono</Label>
                  {isEditing ? (
                    <Input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className={editableFieldClass} placeholder="+54 11 1234-5678" />
                  ) : (
                    <p className="text-sm py-1.5 text-foreground">{organization.phone || '-'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Direccion</Label>
                  {isEditing ? (
                    <Input value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} className={editableFieldClass} placeholder="Dirección" />
                  ) : (
                    <p className="text-sm py-1.5 text-foreground">{organization.address || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Ciudad</Label>
                  {isEditing ? (
                    <Input value={editData.city} onChange={e => setEditData({ ...editData, city: e.target.value })} className={editableFieldClass} placeholder="Ciudad" />
                  ) : (
                    <p className="text-sm py-1.5 text-foreground">{organization.city || '-'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Notas</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.notes}
                    onChange={e => setEditData({ ...editData, notes: e.target.value })}
                    rows={3}
                    className={cn(editableFieldClass, "resize-none")}
                    placeholder="Notas adicionales..."
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap py-1.5 text-foreground">{organization.notes || '-'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base md:text-lg">Usuarios de la Organizacion</CardTitle>
                  <CardDescription>Personas con acceso al portal de soporte</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddUserOpen(true)} className="shrink-0">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Asignar Usuario</span>
                  <span className="sm:hidden">Asignar</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-base font-semibold">Sin usuarios</h3>
                  <p className="text-sm text-muted-foreground">No hay usuarios asignados a esta organizacion</p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="flex flex-col gap-3 sm:hidden">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          {user.job_title && <p className="text-xs text-muted-foreground">{user.job_title}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-destructive hover:text-destructive"
                            onClick={() => removeUserFromOrganization(user.id)}>
                            Quitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => (
                          <TableRow key={user.id}>
                            <TableCell><div className="font-medium">{user.first_name} {user.last_name}</div></TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.job_title || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                {user.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => removeUserFromOrganization(user.id)}>Quitar</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTRACTS TAB */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Contratos de Servicio</CardTitle>
              <CardDescription>Historial de contratos con esta organizacion</CardDescription>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-base font-semibold">Sin contratos</h3>
                  <p className="text-sm text-muted-foreground">No hay contratos registrados</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/admin/contracts">Crear Contrato</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="flex flex-col gap-3 sm:hidden">
                    {contracts.map(contract => (
                      <div key={contract.id} className="flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-card/50">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{contract.name}</p>
                          <Badge variant={contract.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {contract.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="outline" className={planColors[contract.plan]}>
                            {contract.plan.charAt(0).toUpperCase() + contract.plan.slice(1)}
                          </Badge>
                          <span>{new Date(contract.start_date).toLocaleDateString('es-ES')}</span>
                          {contract.end_date && <span>→ {new Date(contract.end_date).toLocaleDateString('es-ES')}</span>}
                        </div>
                        {contract.monthly_fee && (
                          <p className="text-sm font-semibold">
                            {contract.monthly_fee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            <span className="text-xs font-normal text-muted-foreground">/mes</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Periodo</TableHead>
                          <TableHead>Cuota/Mes</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts.map(contract => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">{contract.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={planColors[contract.plan]}>
                                {contract.plan.charAt(0).toUpperCase() + contract.plan.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(contract.start_date).toLocaleDateString('es-ES')}
                              {contract.end_date && ` - ${new Date(contract.end_date).toLocaleDateString('es-ES')}`}
                            </TableCell>
                            <TableCell>
                              {contract.monthly_fee
                                ? contract.monthly_fee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={contract.is_active ? 'default' : 'secondary'}>
                                {contract.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Usuario</DialogTitle>
            <DialogDescription>
              Selecciona un usuario para agregarlo a {organization.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay usuarios disponibles para asignar.
              </p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                <SelectContent>
                  {allUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancelar</Button>
            <Button onClick={assignUserToOrganization} disabled={!selectedUserId}>Asignar Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}