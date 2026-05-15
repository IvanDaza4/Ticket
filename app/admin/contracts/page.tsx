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
import { Plus, Search, FileText, Calendar, Clock, DollarSign } from 'lucide-react'
import type { Contract, Organization, PlanTier } from '@/lib/types'

const planColors: Record<PlanTier, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-slate-100 text-slate-800 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

interface ContractWithOrg extends Contract {
  organization?: { name: string }
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractWithOrg[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newContract, setNewContract] = useState({
    organization_id: '',
    name: '',
    plan: 'bronze' as PlanTier,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    monthly_hours: 20,
    monthly_fee: 0,
    hourly_rate: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [contractsRes, orgsRes] = await Promise.all([
      supabase
        .from('contracts')
        .select('*, organization:organizations(name)')
        .order('start_date', { ascending: false }),
      supabase.from('organizations').select('*').order('name'),
    ])

    if (!contractsRes.error && contractsRes.data) {
      setContracts(contractsRes.data)
    }
    if (!orgsRes.error && orgsRes.data) {
      setOrganizations(orgsRes.data)
    }
    setLoading(false)
  }

  async function createContract() {
    const { error } = await supabase.from('contracts').insert([
      {
        ...newContract,
        end_date: newContract.end_date || null,
      },
    ])

    if (!error) {
      setIsCreateOpen(false)
      setNewContract({
        organization_id: '',
        name: '',
        plan: 'bronze',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_hours: 20,
        monthly_fee: 0,
        hourly_rate: 0,
      })
      fetchData()
    }
  }

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.is_active).length,
    byPlan: {
      bronze: contracts.filter((c) => c.plan === 'bronze').length,
      silver: contracts.filter((c) => c.plan === 'silver').length,
      gold: contracts.filter((c) => c.plan === 'gold').length,
    },
    totalMonthlyRevenue: contracts
      .filter((c) => c.is_active)
      .reduce((sum, c) => sum + (c.monthly_fee || 0), 0),
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">
            Gestiona los contratos de servicio con tus clientes
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Contrato</DialogTitle>
              <DialogDescription>
                Define los terminos del contrato de servicio.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="organization">Cliente *</Label>
                <Select
                  value={newContract.organization_id}
                  onValueChange={(value) =>
                    setNewContract({ ...newContract, organization_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Contrato *</Label>
                <Input
                  id="name"
                  value={newContract.name}
                  onChange={(e) =>
                    setNewContract({ ...newContract, name: e.target.value })
                  }
                  placeholder="Soporte IT 2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={newContract.plan}
                    onValueChange={(value: PlanTier) =>
                      setNewContract({ ...newContract, plan: value })
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
                <div className="grid gap-2">
                  <Label htmlFor="monthly_hours">Horas/Mes</Label>
                  <Input
                    id="monthly_hours"
                    type="number"
                    value={newContract.monthly_hours}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        monthly_hours: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Fecha Inicio *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newContract.start_date}
                    onChange={(e) =>
                      setNewContract({ ...newContract, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_date">Fecha Fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newContract.end_date}
                    onChange={(e) =>
                      setNewContract({ ...newContract, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="monthly_fee">Cuota Mensual (EUR)</Label>
                  <Input
                    id="monthly_fee"
                    type="number"
                    step="0.01"
                    value={newContract.monthly_fee}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        monthly_fee: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hourly_rate">Tarifa/Hora (EUR)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={newContract.hourly_rate}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        hourly_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={createContract}
                disabled={
                  !newContract.organization_id ||
                  !newContract.name ||
                  !newContract.start_date
                }
              >
                Crear Contrato
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
              Total Contratos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Bronze</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byPlan.bronze}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Silver</CardTitle>
            <FileText className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byPlan.silver}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Mensuales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalMonthlyRevenue.toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
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
                placeholder="Buscar contratos..."
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
          ) : filteredContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay contratos</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No se encontraron resultados'
                  : 'Crea tu primer contrato para empezar'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-right">Cuota/Mes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="font-medium">{contract.name}</div>
                      {contract.monthly_hours && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {contract.monthly_hours} horas/mes
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{contract.organization?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={planColors[contract.plan]}
                      >
                        {contract.plan.charAt(0).toUpperCase() +
                          contract.plan.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(contract.start_date).toLocaleDateString('es-ES')}
                        {contract.end_date && (
                          <>
                            {' - '}
                            {new Date(contract.end_date).toLocaleDateString('es-ES')}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {contract.monthly_fee
                        ? contract.monthly_fee.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={contract.is_active ? 'default' : 'secondary'}
                      >
                        {contract.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.location.href = `/admin/contracts/${contract.id}`}
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
