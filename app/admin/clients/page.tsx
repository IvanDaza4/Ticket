'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Building2, Users, FileText } from 'lucide-react'
import type { Organization, PlanTier } from '@/lib/types'

const planColors: Record<PlanTier, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-slate-100 text-slate-800 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

export default function ClientsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrg, setNewOrg] = useState({
    name: '',
    legal_name: '',
    tax_id: '',
    email: '',
    phone: '',
    plan: 'bronze' as PlanTier,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  async function fetchOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (!error && data) {
      setOrganizations(data)
    }
    setLoading(false)
  }

  async function createOrganization() {
    const { error } = await supabase.from('organizations').insert([newOrg])

    if (!error) {
      setIsCreateOpen(false)
      setNewOrg({
        name: '',
        legal_name: '',
        tax_id: '',
        email: '',
        phone: '',
        plan: 'bronze',
      })
      fetchOrganizations()
    }
  }

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: organizations.length,
    active: organizations.filter((o) => o.is_active).length,
    byPlan: {
      bronze: organizations.filter((o) => o.plan === 'bronze').length,
      silver: organizations.filter((o) => o.plan === 'silver').length,
      gold: organizations.filter((o) => o.plan === 'gold').length,
    },
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona las organizaciones y sus contratos
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Organizacion</DialogTitle>
              <DialogDescription>
                Ingresa los datos de la nueva organizacion cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Comercial *</Label>
                <Input
                  id="name"
                  value={newOrg.name}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, name: e.target.value })
                  }
                  placeholder="Empresa S.L."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="legal_name">Razon Social</Label>
                <Input
                  id="legal_name"
                  value={newOrg.legal_name}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, legal_name: e.target.value })
                  }
                  placeholder="Empresa Sociedad Limitada"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tax_id">CIF/NIF</Label>
                  <Input
                    id="tax_id"
                    value={newOrg.tax_id}
                    onChange={(e) =>
                      setNewOrg({ ...newOrg, tax_id: e.target.value })
                    }
                    placeholder="B12345678"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={newOrg.plan}
                    onValueChange={(value: PlanTier) =>
                      setNewOrg({ ...newOrg, plan: value })
                    }
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
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newOrg.email}
                    onChange={(e) =>
                      setNewOrg({ ...newOrg, email: e.target.value })
                    }
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={newOrg.phone}
                    onChange={(e) =>
                      setNewOrg({ ...newOrg, phone: e.target.value })
                    }
                    placeholder="+34 912 345 678"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createOrganization} disabled={!newOrg.name}>
                Crear Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Clientes
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Bronze</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byPlan.bronze}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Silver</CardTitle>
            <FileText className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byPlan.silver}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Gold</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byPlan.gold}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay clientes</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No se encontraron resultados'
                  : 'Crea tu primer cliente para empezar'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organizacion</TableHead>
                  <TableHead>CIF/NIF</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        {org.legal_name && (
                          <div className="text-sm text-muted-foreground">
                            {org.legal_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{org.tax_id || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {org.email && <div>{org.email}</div>}
                        {org.phone && (
                          <div className="text-muted-foreground">
                            {org.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={planColors[org.plan]}
                      >
                        {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={org.is_active ? 'default' : 'secondary'}
                      >
                        {org.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.location.href = `/admin/clients/${org.id}`}
                      >
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
