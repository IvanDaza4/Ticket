import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Monitor, Laptop, Server, Printer, Wifi, Smartphone, Package, HelpCircle, MapPin, Building2 } from 'lucide-react'
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from '@/lib/constants'

const assetIcons: Record<string, typeof Monitor> = {
  pc: Monitor,
  laptop: Laptop,
  server: Server,
  printer: Printer,
  network: Wifi,
  mobile: Smartphone,
  software: Package,
  other: HelpCircle,
}

const assetStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  retired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  disposed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile to find organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user?.id)
    .single()

  // Get assets for user's organization - excluding sensitive fields (ip_address, mac_address)
  const { data: assets } = await supabase
    .from('assets')
    .select(`
      id,
      name,
      asset_type,
      manufacturer,
      model,
      serial_number,
      status,
      location,
      warranty_expiry,
      purchase_date,
      notes,
      assignee:profiles!assets_assigned_to_fkey(first_name, last_name)
    `)
    .eq('organization_id', profile?.organization_id)
    .order('name')

  // Group assets by type
  const assetsByType = assets?.reduce((acc, asset) => {
    const type = asset.asset_type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(asset)
    return acc
  }, {} as Record<string, typeof assets>)

  const totalAssets = assets?.length || 0
  const activeAssets = assets?.filter(a => a.status === 'active').length || 0

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
          Mis Activos
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Inventario de equipos y recursos IT de tu organizacion
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs md:text-sm">Total Activos</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl md:text-3xl font-bold">{totalAssets}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs md:text-sm">Activos Operativos</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl md:text-3xl font-bold text-green-600">{activeAssets}</span>
          </CardContent>
        </Card>
      </div>

      {/* Assets by Type */}
      {assetsByType && Object.keys(assetsByType).length > 0 ? (
        <div className="space-y-4 md:space-y-6">
          {Object.entries(assetsByType).map(([type, typeAssets]) => {
            const Icon = assetIcons[type] || HelpCircle
            return (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base md:text-lg">{ASSET_TYPE_LABELS[type] || type}</CardTitle>
                  </div>
                  <CardDescription>{typeAssets?.length || 0} elementos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {typeAssets?.map((asset) => (
                      <div 
                        key={asset.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 rounded-lg border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground text-sm md:text-base">{asset.name}</h3>
                            <Badge className={assetStatusColors[asset.status]}>
                              {ASSET_STATUS_LABELS[asset.status]}
                            </Badge>
                          </div>
                          <div className="text-xs md:text-sm text-muted-foreground space-y-0.5">
                            {asset.manufacturer && asset.model && (
                              <p className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                {asset.manufacturer} {asset.model}
                              </p>
                            )}
                            {asset.serial_number && (
                              <p>N/S: {asset.serial_number}</p>
                            )}
                            {asset.assignee && (
                              <p>Asignado a: {(asset.assignee as { first_name: string; last_name: string }).first_name} {(asset.assignee as { first_name: string; last_name: string }).last_name}</p>
                            )}
                            {asset.location && (
                              <p className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                {asset.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-xs md:text-sm">
                          {asset.warranty_expiry && (
                            <div className="text-right">
                              <p className="text-muted-foreground">Garantia hasta</p>
                              <p className={
                                new Date(asset.warranty_expiry) < new Date() 
                                  ? 'text-red-600 font-medium' 
                                  : 'text-foreground'
                              }>
                                {new Date(asset.warranty_expiry).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          )}
                          {asset.purchase_date && !asset.warranty_expiry && (
                            <div className="text-right">
                              <p className="text-muted-foreground">Adquirido</p>
                              <p className="text-foreground">
                                {new Date(asset.purchase_date).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 md:py-12 text-center">
            <Monitor className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-foreground mb-2">No hay activos registrados</h3>
            <p className="text-sm text-muted-foreground">
              Tu organizacion aun no tiene activos IT registrados en el sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
