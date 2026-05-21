'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Building2, Users, FileText, Mail, Phone, ChevronRight } from 'lucide-react'
import type { Organization, PlanTier } from '@/lib/types'

const planColors: Record<PlanTier, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-slate-100 text-slate-800 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const planDot: Record<PlanTier, string> = {
  bronze: 'bg-amber-500',
  silver: 'bg-slate-400',
  gold: 'bg-yellow-500',
}

export default function ClientsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrg, setNewOrg] = useState({
    name: '', legal_name: '', tax_id: '', email: '', phone: '', plan: 'bronze' as PlanTier,
  })
  const supabase = createClient()

  useEffect(() => { fetchOrganizations() }, [])

  async function fetchOrganizations() {
    const { data, error } = await supabase.from('organizations').select('*').order('name')
    if (!error && data) setOrganizations(data)
    setLoading(false)
  }

  async function createOrganization() {
    const { error } = await supabase.from('organizations').insert([newOrg])
    if (!error) {
      setIsCreateOpen(false)
      setNewOrg({ name: '', legal_name: '', tax_id: '', email: '', phone: '', plan: 'bronze' })
      fetchOrganizations()
    }
  }

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: organizations.length,
    active: organizations.filter(o => o.is_active).length,
    byPlan: {
      bronze: organizations.filter(o => o.plan === 'bronze').length,
      silver: organizations.filter(o => o.plan === 'silver').length,
      gold: organizations.filter(o => o.plan === 'gold').length,
    },
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Clientes</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">Gestiona las organizaciones y sus contratos</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Cliente</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Organizacion</DialogTitle>
              <DialogDescription>Ingresa los datos de la nueva organizacion cliente.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nombre Comercial *</Label>
                <Input value={newOrg.name} onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} placeholder="Empresa S.L." />
              </div>
              <div className="grid gap-2">
                <Label>Razon Social</Label>
                <Input value={newOrg.legal_name} onChange={e => setNewOrg({ ...newOrg, legal_name: e.target.value })} placeholder="Empresa Sociedad Limitada" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>CIF/NIF</Label>
                  <Input value={newOrg.tax_id} onChange={e => setNewOrg({ ...newOrg, tax_id: e.target.value })} placeholder="B12345678" />
                </div>
                <div className="grid gap-2">
                  <Label>Plan</Label>
                  <Select value={newOrg.plan} onValueChange={(v: PlanTier) => setNewOrg({ ...newOrg, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>Email</Label>
                  <Input type="email" value={newOrg.email} onChange={e => setNewOrg({ ...newOrg, email: e.target.value })} placeholder="contacto@empresa.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Telefono</Label>
                  <Input value={newOrg.phone} onChange={e => setNewOrg({ ...newOrg, phone: e.target.value })} placeholder="+34 912 345 678" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={createOrganization} disabled={!newOrg.name}>Crear Cliente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards — 2 col on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.active} activos</p>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Plan Bronze</CardTitle>
            <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.byPlan.bronze}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Plan Silver</CardTitle>
            <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.byPlan.silver}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Plan Gold</CardTitle>
            <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.byPlan.gold}</div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar clientes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
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
              <p className="text-muted-foreground text-sm">{searchQuery ? 'No se encontraron resultados' : 'Crea tu primer cliente para empezar'}</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredOrgs.map(org => (
                  <button
                    key={org.id}
                    onClick={() => window.location.href = `/admin/clients/${org.id}`}
                    className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors text-left w-full"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${planDot[org.plan]}`} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{org.name}</p>
                          {org.legal_name && <p className="text-xs text-muted-foreground truncate">{org.legal_name}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className={`text-xs ${planColors[org.plan]}`}>
                          {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                      <div className="flex items-center gap-3">
                        {org.email && <span className="flex items-center gap-1 truncate max-w-[140px]"><Mail className="h-3 w-3 shrink-0" />{org.email}</span>}
                        {org.phone && !org.email && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{org.phone}</span>}
                        {org.tax_id && <span>{org.tax_id}</span>}
                      </div>
                      <Badge variant={org.is_active ? 'default' : 'secondary'} className="text-xs">
                        {org.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
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
                    {filteredOrgs.map(org => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            {org.legal_name && <div className="text-sm text-muted-foreground">{org.legal_name}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{org.tax_id || '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {org.email && <div>{org.email}</div>}
                            {org.phone && <div className="text-muted-foreground">{org.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={planColors[org.plan]}>
                            {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.is_active ? 'default' : 'secondary'}>
                            {org.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/admin/clients/${org.id}`}>
                            Ver detalles
                          </Button>
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
    </div>
  )
}