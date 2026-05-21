'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Separator } from '@/components/ui/separator'
import {
  Plus, Search, Monitor, Laptop, Server, Printer, Network, Smartphone, Package,
  HardDrive, MapPin, Tag, Calendar, Hash, Building2, Wifi,
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
  pc: 'PC', laptop: 'Portatil', server: 'Servidor', printer: 'Impresora',
  network: 'Red', mobile: 'Movil', software: 'Software', other: 'Otro',
}

const statusColors: Record<AssetStatus, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  retired: 'bg-gray-100 text-gray-800 border-gray-200',
  disposed: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels: Record<AssetStatus, string> = {
  active: 'Activo', maintenance: 'Mantenimiento', retired: 'Retirado', disposed: 'Dado de baja',
}

const assetTypeBg: Record<AssetType, string> = {
  pc: 'bg-blue-500/10 text-blue-400',
  laptop: 'bg-indigo-500/10 text-indigo-400',
  server: 'bg-purple-500/10 text-purple-400',
  printer: 'bg-orange-500/10 text-orange-400',
  network: 'bg-cyan-500/10 text-cyan-400',
  mobile: 'bg-pink-500/10 text-pink-400',
  software: 'bg-emerald-500/10 text-emerald-400',
  other: 'bg-gray-500/10 text-gray-400',
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  )
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
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [newAsset, setNewAsset] = useState({
    name: '', asset_type: 'pc' as AssetType, status: 'active' as AssetStatus,
    organization_id: '', serial_number: '', manufacturer: '', model: '',
    location: '', ip_address: '', notes: '',
  })
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [assetsRes, orgsRes] = await Promise.all([
      supabase.from('assets').select('*').order('name'),
      supabase.from('organizations').select('*').order('name'),
    ])
    if (!assetsRes.error && assetsRes.data) setAssets(assetsRes.data)
    if (!orgsRes.error && orgsRes.data) setOrganizations(orgsRes.data)
    setLoading(false)
  }

  async function createAsset() {
    const { error } = await supabase.from('assets').insert([newAsset])
    if (!error) {
      setIsCreateOpen(false)
      setNewAsset({ name: '', asset_type: 'pc', status: 'active', organization_id: '', serial_number: '', manufacturer: '', model: '', location: '', ip_address: '', notes: '' })
      fetchData()
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.ip_address?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch &&
      (typeFilter === 'all' || asset.asset_type === typeFilter) &&
      (statusFilter === 'all' || asset.status === statusFilter) &&
      (orgFilter === 'all' || asset.organization_id === orgFilter)
  })

  const stats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    computers: assets.filter(a => ['pc', 'laptop'].includes(a.asset_type)).length,
    network: assets.filter(a => ['server', 'network'].includes(a.asset_type)).length,
  }

  const getOrgName = (orgId: string) => organizations.find(o => o.id === orgId)?.name || 'Sin asignar'

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Activos</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">Inventario de equipos y software (CMDB)</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Activo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Activo</DialogTitle>
              <DialogDescription>Agrega un nuevo equipo o software al inventario.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nombre *</Label>
                  <Input value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} placeholder="PC-RECEPCION-01" />
                </div>
                <div className="grid gap-2">
                  <Label>Organizacion *</Label>
                  <Select value={newAsset.organization_id} onValueChange={v => setNewAsset({ ...newAsset, organization_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={newAsset.asset_type} onValueChange={(v: AssetType) => setNewAsset({ ...newAsset, asset_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(assetTypeLabels) as AssetType[]).map(t => <SelectItem key={t} value={t}>{assetTypeLabels[t]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <Select value={newAsset.status} onValueChange={(v: AssetStatus) => setNewAsset({ ...newAsset, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(statusLabels) as AssetStatus[]).map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fabricante</Label>
                  <Input value={newAsset.manufacturer} onChange={e => setNewAsset({ ...newAsset, manufacturer: e.target.value })} placeholder="Dell, HP..." />
                </div>
                <div className="grid gap-2">
                  <Label>Modelo</Label>
                  <Input value={newAsset.model} onChange={e => setNewAsset({ ...newAsset, model: e.target.value })} placeholder="OptiPlex 7090" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Numero de Serie</Label>
                  <Input value={newAsset.serial_number} onChange={e => setNewAsset({ ...newAsset, serial_number: e.target.value })} placeholder="ABC123XYZ" />
                </div>
                <div className="grid gap-2">
                  <Label>Direccion IP</Label>
                  <Input value={newAsset.ip_address} onChange={e => setNewAsset({ ...newAsset, ip_address: e.target.value })} placeholder="192.168.1.100" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Ubicacion</Label>
                <Input value={newAsset.location} onChange={e => setNewAsset({ ...newAsset, location: e.target.value })} placeholder="Oficina principal..." />
              </div>
              <div className="grid gap-2">
                <Label>Notas</Label>
                <Textarea value={newAsset.notes} onChange={e => setNewAsset({ ...newAsset, notes: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={createAsset} disabled={!newAsset.name || !newAsset.organization_id}>Crear Activo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards — 2 col on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total Activos</CardTitle>
            <HardDrive className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.active} activos</p>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">PCs/Portatiles</CardTitle>
            <Monitor className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.computers}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Servidores/Red</CardTitle>
            <Server className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.network}</div>
          </CardContent>
        </Card>
        <Card className="py-3 md:py-6 gap-2 md:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Otros Equipos</CardTitle>
            <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold">{stats.total - stats.computers - stats.network}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar activos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {(Object.keys(assetTypeLabels) as AssetType[]).map(t => <SelectItem key={t} value={t}>{assetTypeLabels[t]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {(Object.keys(statusLabels) as AssetStatus[]).map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger className="w-[150px] shrink-0">
                  <SelectValue placeholder="Organizacion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
              <p className="text-muted-foreground text-sm">{searchQuery ? 'No se encontraron resultados' : 'Registra tu primer activo para empezar'}</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredAssets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => { setSelectedAsset(asset); setIsDetailOpen(true) }}
                    className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors text-left w-full"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${assetTypeBg[asset.asset_type]}`}>
                        {assetTypeIcons[asset.asset_type]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground truncate">{asset.name}</p>
                        {asset.manufacturer && asset.model && (
                          <p className="text-xs text-muted-foreground">{asset.manufacturer} {asset.model}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 ${statusColors[asset.status]}`}>
                        {statusLabels[asset.status]}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{getOrgName(asset.organization_id)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Tag className="h-3 w-3 shrink-0" />
                        <span>{assetTypeLabels[asset.asset_type]}</span>
                      </div>
                      {asset.location && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{asset.location}</span>
                        </div>
                      )}
                      {asset.ip_address && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Wifi className="h-3 w-3 shrink-0" />
                          <span className="font-mono">{asset.ip_address}</span>
                        </div>
                      )}
                      {asset.serial_number && (
                        <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                          <Hash className="h-3 w-3 shrink-0" />
                          <span className="font-mono">{asset.serial_number}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
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
                    {filteredAssets.map(asset => (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{assetTypeIcons[asset.asset_type]}</span>
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              {asset.manufacturer && asset.model && (
                                <div className="text-sm text-muted-foreground">{asset.manufacturer} {asset.model}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getOrgName(asset.organization_id)}</TableCell>
                        <TableCell><Badge variant="outline">{assetTypeLabels[asset.asset_type]}</Badge></TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {asset.serial_number && <div>{asset.serial_number}</div>}
                            {asset.ip_address && <div className="text-muted-foreground font-mono">{asset.ip_address}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{asset.location || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[asset.status]}>{statusLabels[asset.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedAsset(asset); setIsDetailOpen(true) }}>
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

      {/* Asset Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[520px]">
          {selectedAsset && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${assetTypeBg[selectedAsset.asset_type]}`}>
                    {assetTypeIcons[selectedAsset.asset_type]}
                  </div>
                  <div>
                    <DialogTitle className="text-left">{selectedAsset.name}</DialogTitle>
                    <DialogDescription className="text-left">
                      {assetTypeLabels[selectedAsset.asset_type]}
                      {selectedAsset.manufacturer && selectedAsset.model && <> · {selectedAsset.manufacturer} {selectedAsset.model}</>}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className={statusColors[selectedAsset.status]}>{statusLabels[selectedAsset.status]}</Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />{getOrgName(selectedAsset.organization_id)}
                  </span>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <DetailRow icon={<Tag className="h-3.5 w-3.5" />} label="Fabricante" value={selectedAsset.manufacturer} />
                  <DetailRow icon={<Monitor className="h-3.5 w-3.5" />} label="Modelo" value={selectedAsset.model} />
                  <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label="Número de Serie" value={selectedAsset.serial_number} />
                  <DetailRow icon={<Network className="h-3.5 w-3.5" />} label="Dirección IP" value={selectedAsset.ip_address} />
                  <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Ubicación" value={selectedAsset.location} />
                  <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha de compra"
                    value={selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString('es-ES') : undefined} />
                  <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Garantía hasta"
                    value={selectedAsset.warranty_expiry ? new Date(selectedAsset.warranty_expiry).toLocaleDateString('es-ES') : undefined} />
                </div>
                {selectedAsset.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notas</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedAsset.notes}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Registrado: {new Date(selectedAsset.created_at).toLocaleDateString('es-ES')}</span>
                  <span>Actualizado: {new Date(selectedAsset.updated_at).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}