'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Ticket,
  Star,
  Target,
} from 'lucide-react'

interface DashboardStats {
  totalTickets: number
  openTickets: number
  resolvedToday: number
  avgResolutionTime: number
  slaCompliance: number
  csatAverage: number
  ticketsByStatus: { status: string; count: number }[]
  ticketsByPriority: { priority: number; count: number }[]
  ticketsTrend: { date: string; created: number; resolved: number }[]
  technicianPerformance: { name: string; resolved: number; avgTime: number }[]
  clientActivity: { name: string; tickets: number; plan: string }[]
}

const chartConfig = {
  created: {
    label: 'Creados',
    color: 'var(--chart-1)',
  },
  resolved: {
    label: 'Resueltos',
    color: 'var(--chart-2)',
  },
  open: {
    label: 'Abiertos',
    color: 'var(--chart-1)',
  },
  in_progress: {
    label: 'En Progreso',
    color: 'var(--chart-2)',
  },
  waiting: {
    label: 'En Espera',
    color: 'var(--chart-3)',
  },
  closed: {
    label: 'Cerrados',
    color: 'var(--chart-4)',
  },
}

const statusColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  '220 70% 50%)',
  'oklch(0.5 0.1 220)',
]

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardStats()
  }, [period])

  async function fetchDashboardStats() {
    setLoading(true)

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    if (period === '7d') startDate.setDate(now.getDate() - 7)
    else if (period === '30d') startDate.setDate(now.getDate() - 30)
    else if (period === '90d') startDate.setDate(now.getDate() - 90)

    // Fetch all tickets in period
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', startDate.toISOString())

    // Fetch CSAT surveys
    const { data: csatData } = await supabase
      .from('csat_surveys')
      .select('rating')
      .gte('created_at', startDate.toISOString())

    // Fetch technicians with profiles
    const { data: technicians } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('role', ['technician', 'admin'])

    // Fetch organizations
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, plan')

    // Calculate stats
    const totalTickets = tickets?.length || 0
    const openTickets = tickets?.filter((t) =>
      ['open', 'in_progress', 'waiting_client', 'waiting_provider'].includes(t.status)
    ).length || 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const resolvedToday = tickets?.filter((t) => {
      if (!t.resolved_at) return false
      const resolvedDate = new Date(t.resolved_at)
      return resolvedDate >= today
    }).length || 0

    // Calculate average resolution time (in hours)
    const resolvedTickets = tickets?.filter((t) => t.resolved_at) || []
    const avgResolutionTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime()
          const resolved = new Date(t.resolved_at).getTime()
          return sum + (resolved - created) / (1000 * 60 * 60) // hours
        }, 0) / resolvedTickets.length
        : 0

    // SLA compliance
    const ticketsWithSla = tickets?.filter((t) => t.sla_resolution_deadline) || []
    const slaCompliant = ticketsWithSla.filter((t) => !t.is_sla_breached).length
    const slaCompliance =
      ticketsWithSla.length > 0
        ? Math.round((slaCompliant / ticketsWithSla.length) * 100)
        : 100

    // CSAT average
    const csatAverage =
      csatData && csatData.length > 0
        ? csatData.reduce((sum, c) => sum + c.rating, 0) / csatData.length
        : 0

    // Tickets by status
    const statusCounts: Record<string, number> = {}
    tickets?.forEach((t) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
    })
    const ticketsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: formatStatus(status),
      count,
    }))

    // Tickets by priority
    const priorityCounts: Record<number, number> = {}
    tickets?.forEach((t) => {
      const priority = t.priority_score || 1
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
    })
    const ticketsByPriority = Object.entries(priorityCounts)
      .map(([priority, count]) => ({
        priority: parseInt(priority),
        count,
      }))
      .sort((a, b) => b.priority - a.priority)

    // Tickets trend (daily)
    const trendData: Record<string, { created: number; resolved: number }> = {}
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      trendData[dateStr] = { created: 0, resolved: 0 }
    }

    tickets?.forEach((t) => {
      const createdDate = t.created_at.split('T')[0]
      if (trendData[createdDate]) {
        trendData[createdDate].created++
      }
      if (t.resolved_at) {
        const resolvedDate = t.resolved_at.split('T')[0]
        if (trendData[resolvedDate]) {
          trendData[resolvedDate].resolved++
        }
      }
    })

    const ticketsTrend = Object.entries(trendData).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      }),
      ...data,
    }))

    // Technician performance
    const techPerf: Record<string, { resolved: number; totalTime: number }> = {}
    tickets?.forEach((t) => {
      if (t.assigned_to && t.resolved_at) {
        if (!techPerf[t.assigned_to]) {
          techPerf[t.assigned_to] = { resolved: 0, totalTime: 0 }
        }
        techPerf[t.assigned_to].resolved++
        const created = new Date(t.created_at).getTime()
        const resolved = new Date(t.resolved_at).getTime()
        techPerf[t.assigned_to].totalTime += (resolved - created) / (1000 * 60 * 60)
      }
    })

    const technicianPerformance = Object.entries(techPerf)
      .map(([id, data]) => {
        const tech = technicians?.find((t) => t.id === id)
        return {
          name: tech ? `${tech.first_name || ''} ${tech.last_name || ''}`.trim() || 'Sin nombre' : 'Desconocido',
          resolved: data.resolved,
          avgTime: data.resolved > 0 ? Math.round(data.totalTime / data.resolved) : 0,
        }
      })
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 10)

    // Client activity
    const clientTickets: Record<string, number> = {}
    tickets?.forEach((t) => {
      clientTickets[t.organization_id] = (clientTickets[t.organization_id] || 0) + 1
    })

    const clientActivity = Object.entries(clientTickets)
      .map(([id, count]) => {
        const org = organizations?.find((o) => o.id === id)
        return {
          name: org?.name || 'Desconocido',
          tickets: count,
          plan: org?.plan || 'bronze',
        }
      })
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 10)

    setStats({
      totalTickets,
      openTickets,
      resolvedToday,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      slaCompliance,
      csatAverage: Math.round(csatAverage * 10) / 10,
      ticketsByStatus,
      ticketsByPriority,
      ticketsTrend,
      technicianPerformance,
      clientActivity,
    })

    setLoading(false)
  }

  function formatStatus(status: string): string {
    const labels: Record<string, string> = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      waiting_client: 'Esperando Cliente',
      waiting_provider: 'Esperando Proveedor',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Metricas</h1>
          <p className="text-muted-foreground">
            Analisis de rendimiento y KPIs del servicio de soporte
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Ultimos 7 dias</SelectItem>
            <SelectItem value="30d">Ultimos 30 dias</SelectItem>
            <SelectItem value="90d">Ultimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.openTickets || 0} abiertos actualmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.resolvedToday || 0}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              Productividad del dia
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgResolutionTime || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              Tiempo de resolucion promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento SLA</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.slaCompliance || 0}%</div>
            <div
              className={`flex items-center text-xs ${(stats?.slaCompliance || 0) >= 90
                ? 'text-green-600'
                : (stats?.slaCompliance || 0) >= 70
                  ? 'text-yellow-600'
                  : 'text-red-600'
                }`}
            >
              {(stats?.slaCompliance || 0) >= 90 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {(stats?.slaCompliance || 0) >= 90 ? 'Excelente' : 'Mejorable'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row of KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CSAT Promedio</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {stats?.csatAverage || 0}
              </span>
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= (stats?.csatAverage || 0)
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tickets en Riesgo SLA
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {100 - (stats?.slaCompliance || 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Porcentaje de tickets con SLA incumplido
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="distribution">Distribucion</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolucion de Tickets</CardTitle>
              <CardDescription>
                Tickets creados vs resueltos en el periodo seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <AreaChart data={stats?.ticketsTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="1"
                    stroke="var(--color-created)"
                    fill="var(--color-created)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="2"
                    stroke="var(--color-resolved)"
                    fill="var(--color-resolved)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Por Estado</CardTitle>
                <CardDescription>Distribucion de tickets por estado</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <Pie
                      data={stats?.ticketsByStatus || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {(stats?.ticketsByStatus || []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={statusColors[index % statusColors.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Prioridad</CardTitle>
                <CardDescription>
                  Distribucion de tickets por puntuacion de prioridad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={stats?.ticketsByPriority || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-chart-1)" radius={4} />                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Tecnicos</CardTitle>
              <CardDescription>
                Tickets resueltos y tiempo promedio de resolucion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(stats?.technicianPerformance || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Sin datos</h3>
                  <p className="text-muted-foreground">
                    No hay datos de rendimiento para el periodo seleccionado
                  </p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <BarChart
                    data={stats?.technicianPerformance || []}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="resolved"
                      fill="var(--color-chart-2)"
                      radius={4}
                      name="Tickets Resueltos"
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {(stats?.technicianPerformance || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tabla de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Tecnico</th>
                        <th className="p-3 text-center font-medium">Resueltos</th>
                        <th className="p-3 text-center font-medium">
                          Tiempo Prom. (h)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats?.technicianPerformance || []).map((tech, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3">{tech.name}</td>
                          <td className="p-3 text-center font-medium">
                            {tech.resolved}
                          </td>
                          <td className="p-3 text-center">{tech.avgTime}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad por Cliente</CardTitle>
              <CardDescription>
                Clientes con mayor numero de tickets en el periodo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(stats?.clientActivity || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Sin datos</h3>
                  <p className="text-muted-foreground">
                    No hay actividad de clientes para el periodo seleccionado
                  </p>
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <BarChart data={stats?.clientActivity || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="tickets"
                      fill="var(--color-chart-3)"
                      radius={4}
                      name="Tickets"
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {(stats?.clientActivity || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Cliente</th>
                        <th className="p-3 text-center font-medium">Plan</th>
                        <th className="p-3 text-center font-medium">Tickets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats?.clientActivity || []).map((client, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3">{client.name}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${client.plan === 'gold'
                                ? 'bg-yellow-100 text-yellow-800'
                                : client.plan === 'silver'
                                  ? 'bg-slate-100 text-slate-800'
                                  : 'bg-amber-100 text-amber-800'
                                }`}
                            >
                              {client.plan.charAt(0).toUpperCase() +
                                client.plan.slice(1)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-medium">
                            {client.tickets}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
