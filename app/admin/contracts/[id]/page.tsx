'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Edit, 
  FileText, 
  Loader2,
  Building2,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import type { Contract, PlanTier } from '@/lib/types'

const planColors: Record<PlanTier, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-slate-100 text-slate-800 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

interface ContractWithOrg extends Contract {
  organization?: { name: string; id: string }
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<ContractWithOrg | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Use string state for numeric inputs to allow clearing zeros
  const [editData, setEditData] = useState({
    name: '',
    plan: 'bronze' as PlanTier,
    start_date: '',
    end_date: '',
    monthly_hours: '' as string,
    monthly_fee: '' as string,
    hourly_rate: '' as string,
    is_active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchContract()
    }
  }, [params.id])

  async function fetchContract() {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, organization:organizations(id, name)')
      .eq('id', params.id)
      .single()

    if (!error && data) {
      setContract(data)
      setEditData({
        name: data.name,
        plan: data.plan,
        start_date: data.start_date,
        end_date: data.end_date || '',
        monthly_hours: data.monthly_hours != null ? String(data.monthly_hours) : '',
        monthly_fee: data.monthly_fee != null ? String(data.monthly_fee) : '',
        hourly_rate: data.hourly_rate != null ? String(data.hourly_rate) : '',
        is_active: data.is_active,
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('contracts')
      .update({
        name: editData.name,
        plan: editData.plan,
        start_date: editData.start_date,
        end_date: editData.end_date || null,
        monthly_hours: editData.monthly_hours === '' ? null : parseInt(editData.monthly_hours) || 0,
        monthly_fee: editData.monthly_fee === '' ? null : parseFloat(editData.monthly_fee) || 0,
        hourly_rate: editData.hourly_rate === '' ? null : parseFloat(editData.hourly_rate) || 0,
        is_active: editData.is_active,
      })
      .eq('id', params.id)

    if (!error) {
      await fetchContract()
      setIsEditOpen(false)
    }
    setSaving(false)
  }

  async function handleDelete() {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', params.id)

    if (!error) {
      router.push('/admin/contracts')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Contrato no encontrado</h3>
          <p className="text-muted-foreground mb-4">El contrato que buscas no existe o fue eliminado.</p>
          <Button asChild>
            <Link href="/admin/contracts">Volver a Contratos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="self-start">
          <Link href="/admin/contracts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className={planColors[contract.plan]}>
              {contract.plan.charAt(0).toUpperCase() + contract.plan.slice(1)}
            </Badge>
            <Badge variant={contract.is_active ? 'default' : 'secondary'}>
              {contract.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            {contract.name}
          </h1>
          {contract.organization && (
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" />
              {contract.organization.name}
            </p>
          )}
        </div>
        <div className="flex gap-2 self-start sm:self-center">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Periodo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de inicio</p>
              <p className="font-medium">
                {new Date(contract.start_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Fecha de fin</p>
              <p className="font-medium">
                {contract.end_date 
                  ? new Date(contract.end_date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Indefinido'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hours */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Horas de Soporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Horas mensuales incluidas</p>
              <p className="text-2xl font-bold">{contract.monthly_hours || 0}h</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Tarifa hora adicional</p>
              <p className="font-medium">
                {contract.hourly_rate 
                  ? contract.hourly_rate.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                  : 'No definida'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Facturacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Cuota mensual</p>
              <p className="text-2xl font-bold">
                {contract.monthly_fee 
                  ? contract.monthly_fee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                  : '-'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Ingresos anuales estimados</p>
              <p className="font-medium">
                {contract.monthly_fee 
                  ? (contract.monthly_fee * 12).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Contrato</DialogTitle>
            <DialogDescription>
              Modifica los detalles del contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Contrato</Label>
              <Input
                id="name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan">Plan</Label>
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
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthly_hours">Horas/Mes</Label>
                <Input
                  id="monthly_hours"
                  type="number"
                  min="0"
                  value={editData.monthly_hours}
                  onChange={(e) => setEditData({ ...editData, monthly_hours: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Fecha Inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={editData.start_date}
                  onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">Fecha Fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={editData.end_date}
                  onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="monthly_fee">Cuota Mensual (EUR)</Label>
                <Input
                  id="monthly_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.monthly_fee}
                  onChange={(e) => setEditData({ ...editData, monthly_fee: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hourly_rate">Tarifa/Hora (EUR)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.hourly_rate}
                  onChange={(e) => setEditData({ ...editData, hourly_rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_active">Estado</Label>
              <Select
                value={editData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => setEditData({ ...editData, is_active: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente el contrato &quot;{contract.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}