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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  Ticket,
  Edit,
  Save,
  Loader2,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import type { Organization, Profile, Contract, PlanTier } from '@/lib/types'

const planColors: Record<PlanTier, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-slate-100 text-slate-800 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
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
    name: '',
    legal_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    plan: 'bronze' as PlanTier,
    notes: '',
  })
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  async function fetchData() {
    const orgId = params.id as string

    // Fetch organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError || !orgData) {
      router.push('/admin/clients')
      return
    }

    setOrganization(orgData)
    setEditData({
      name: orgData.name || '',
      legal_name: orgData.legal_name || '',
      tax_id: orgData.tax_id || '',
      email: orgData.email || '',
      phone: orgData.phone || '',
      address: orgData.address || '',
      city: orgData.city || '',
      plan: orgData.plan,
      notes: orgData.notes || '',
    })

    // Fetch users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', orgId)
      .order('first_name')

    setUsers(usersData || [])

    // Fetch contracts
    const { data: contractsData } = await supabase
      .from('contracts')
      .select('*')
      .eq('organization_id', orgId)
      .order('start_date', { ascending: false })

    setContracts(contractsData || [])

    // Fetch ticket count
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    setTicketCount(count || 0)

    // Fetch all users without organization for adding
    const { data: unassignedUsers } = await supabase
      .from('profiles')
      .select('*')
      .is('organization_id', null)
      .eq('role', 'client')
      .order('first_name')

    setAllUsers(unassignedUsers || [])

    setLoading(false)
  }

  async function saveOrganization() {
    if (!organization) return

    setSaving(true)

    const { error } = await supabase
      .from('organizations')
      .update(editData)
      .eq('id', organization.id)

    setSaving(false)

    if (!error) {
      setIsEditing(false)
      fetchData()
    }
  }

  async function assignUserToOrganization() {
    if (!selectedUserId || !organization) return

    const { error } = await supabase
      .from('profiles')
      .update({ organization_id: organization.id })
      .eq('id', selectedUserId)

    if (!error) {
      setIsAddUserOpen(false)
      setSelectedUserId('')
      fetchData()
    }
  }

  async function removeUserFromOrganization(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ organization_id: null })
      .eq('id', userId)

    if (!error) {
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!organization) {
    return null
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
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
            <p className="text-muted-foreground">{organization.legal_name}</p>
          )}
        </div>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          onClick={() => isEditing ? saveOrganization() : setIsEditing(true)}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={planColors[organization.plan]}>
              {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Organizacion</CardTitle>
              <CardDescription>
                Informacion general y de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Comercial</Label>
                  {isEditing ? (
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{organization.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Razon Social</Label>
                  {isEditing ? (
                    <Input
                      value={editData.legal_name}
                      onChange={(e) => setEditData({ ...editData, legal_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{organization.legal_name || '-'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CIF/NIF</Label>
                  {isEditing ? (
                    <Input
                      value={editData.tax_id}
                      onChange={(e) => setEditData({ ...editData, tax_id: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{organization.tax_id || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  {isEditing ? (
                    <Select
                      value={editData.plan}
                      onValueChange={(value: PlanTier) => setEditData({ ...editData, plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={planColors[organization.plan]}>
                      {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{organization.email || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefono
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{organization.phone || '-'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Direccion
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{organization.address || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  {isEditing ? (
                    <Input
                      value={editData.city}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{organization.city || '-'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{organization.notes || '-'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuarios de la Organizacion</CardTitle>
                  <CardDescription>
                    Personas con acceso al portal de soporte
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Asignar Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                  <h3 className="mt-4 text-lg font-semibold">Sin usuarios</h3>
                  <p className="text-muted-foreground">
                    No hay usuarios asignados a esta organizacion
                  </p>
                </div>
              ) : (
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
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.job_title || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUserFromOrganization(user.id)}
                          >
                            Quitar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Contratos de Servicio</CardTitle>
              <CardDescription>
                Historial de contratos con esta organizacion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                  <h3 className="mt-4 text-lg font-semibold">Sin contratos</h3>
                  <p className="text-muted-foreground">
                    No hay contratos registrados
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/admin/contracts">Crear Contrato</Link>
                  </Button>
                </div>
              ) : (
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
                    {contracts.map((contract) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Usuario a la Organizacion</DialogTitle>
            <DialogDescription>
              Selecciona un usuario sin organizacion asignada para agregarlo a {organization.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay usuarios disponibles para asignar. Los usuarios deben registrarse primero.
              </p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={assignUserToOrganization} disabled={!selectedUserId}>
              Asignar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
