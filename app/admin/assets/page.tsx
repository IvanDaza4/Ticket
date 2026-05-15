'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Plus,
  Search,
  Monitor,
  Laptop,
  Server,
  Printer,
  Network,
  Smartphone,
  Package,
  HardDrive,
} from 'lucide-react'
import type { Asset, AssetType, AssetStatus, Organization } from '@/lib/types'

const assetTypeIcons: Record<AssetType, React.ReactNode> = {
  pc: <Monitor className="h-4 w-4" />,
  laptop: <Laptop className="h-4 w-4" />,
  server: <Server className="h-4 w-4" />,
  printer: <Printer className="h-4 w-4" />,
  network: <Network className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  software: <Package className="h-4 w-4" />,
  other: <HardDrive className="h-4 w-4" />,
}

const assetTypeLabels: Record<AssetType, string> = {
  pc: 'PC',
  laptop: 'Portatil',
  server: 'Servidor',
  printer: 'Impresora',
  network: 'Red',
  mobile: 'Movil',
  software: 'Software',
  other: 'Otro',
}

const statusColors: Record<AssetStatus, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  retired: 'bg-gray-100 text-gray-800 border-gray-200',
  disposed: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels: Record<AssetStatus, string> = {
  active: 'Activo',
  maintenance: 'Mantenimiento',
  retired: 'Retirado',
  disposed: 'Dado de baja',
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [orgFilter, setOrgFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newAsset, setNewAsset] = useState({
    name: '',
    asset_type: 'pc' as AssetType,
    status: 'active' as AssetStatus,
    organization_id: '',
    serial_number: '',
    manufacturer: '',
    model: '',
    location: '',
    ip_address: '',
    notes: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [assetsRes, orgsRes] = await Promise.all([
      supabase.from('assets').select('*').order('name'),
      supabase.from('organizations').select('*').order('name'),
    ])

    if (!assetsRes.error && assetsRes.data) {
      setAssets(assetsRes.data)
    }
    if (!orgsRes.error && orgsRes.data) {
      setOrganizations(orgsRes.data)
    }
    setLoading(false)
  }

  async function createAsset() {
    const { error } = await supabase.from('assets').insert([newAsset])

    if (!error) {
      setIsCreateOpen(false)
      setNewAsset({
        name: '',
        asset_type: 'pc',
        status: 'active',
        organization_id: '',
        serial_number: '',
        manufacturer: '',
        model: '',
        location: '',
        ip_address: '',
        notes: '',
      })
      fetchData()
    }
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.ip_address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType =
      typeFilter === 'all' || asset.asset_type === typeFilter
    const matchesStatus =
      statusFilter === 'all' || asset.status === statusFilter
    const matchesOrg =
      orgFilter === 'all' || asset.organization_id === orgFilter
    return matchesSearch && matchesType && matchesStatus && matchesOrg
  })

  const stats = {
    total: assets.length,
    active: assets.filter((a) => a.status === 'active').length,
    byType: Object.keys(assetTypeLabels).reduce(
      (acc, type) => ({
        ...acc,
        [type]: assets.filter((a) => a.asset_type === type).length,
      }),
      {} as Record<string, number>
    ),
  }

  const getOrgName = (orgId: string) =>
    organizations.find((o) => o.id === orgId)?.name || 'Sin asignar'

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activos</h1>
          <p className="text-muted-foreground">
            Inventario de equipos y software (CMDB)
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Activo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Activo</DialogTitle>
              <DialogDescription>
                Agrega un nuevo equipo o software al inventario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={newAsset.name}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, name: e.target.value })
                    }
                    placeholder="PC-RECEPCION-01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="organization">Organizacion *</Label>
                  <Select
                    value={newAsset.organization_id}
                    onValueChange={(value) =>
                      setNewAsset({ ...newAsset, organization_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="asset_type">Tipo</Label>
                  <Select
                    value={newAsset.asset_type}
                    onValueChange={(value: AssetType) =>
                      setNewAsset({ ...newAsset, asset_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(assetTypeLabels) as AssetType[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {assetTypeLabels[type]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={newAsset.status}
                    onValueChange={(value: AssetStatus) =>
                      setNewAsset({ ...newAsset, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusLabels) as AssetStatus[]).map(
                        (status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manufacturer">Fabricante</Label>
                  <Input
                    id="manufacturer"
                    value={newAsset.manufacturer}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, manufacturer: e.target.value })
                    }
                    placeholder="Dell, HP, Lenovo..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={newAsset.model}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, model: e.target.value })
                    }
                    placeholder="OptiPlex 7090"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="serial_number">Numero de Serie</Label>
                  <Input
                    id="serial_number"
                    value={newAsset.serial_number}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, serial_number: e.target.value })
                    }
                    placeholder="ABC123XYZ"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ip_address">Direccion IP</Label>
                  <Input
                    id="ip_address"
                    value={newAsset.ip_address}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, ip_address: e.target.value })
                    }
                    placeholder="192.168.1.100"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Ubicacion</Label>
                <Input
                  id="location"
                  value={newAsset.location}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, location: e.target.value })
                  }
                  placeholder="Oficina principal, Planta 2..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={newAsset.notes}
                  onChange={(e) =>
                    setNewAsset({ ...newAsset, notes: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={createAsset}
                disabled={!newAsset.name || !newAsset.organization_id}
              >
                Crear Activo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activos</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">PCs/Portatiles</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byType['pc'] || 0) + (stats.byType['laptop'] || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servidores</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType['server'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Red</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType['network'] || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar activos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {(Object.keys(assetTypeLabels) as AssetType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {assetTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {(Object.keys(statusLabels) as AssetStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Organizacion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HardDrive className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay activos</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No se encontraron resultados'
                  : 'Registra tu primer activo para empezar'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activo</TableHead>
                  <TableHead>Organizacion</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Serie / IP</TableHead>
                  <TableHead>Ubicacion</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {assetTypeIcons[asset.asset_type]}
                        </span>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          {asset.manufacturer && asset.model && (
                            <div className="text-sm text-muted-foreground">
                              {asset.manufacturer} {asset.model}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getOrgName(asset.organization_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assetTypeLabels[asset.asset_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {asset.serial_number && <div>{asset.serial_number}</div>}
                        {asset.ip_address && (
                          <div className="text-muted-foreground font-mono">
                            {asset.ip_address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{asset.location || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[asset.status]}
                      >
                        {statusLabels[asset.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
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
