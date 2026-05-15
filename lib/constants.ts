// Constants and configuration for Ingnala Support V2

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  waiting_client: 'Esperando Cliente',
  waiting_provider: 'Esperando Proveedor',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

export const TICKET_STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_client: 'bg-orange-100 text-orange-800',
  waiting_provider: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export const TICKET_URGENCY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export const TICKET_URGENCY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export const TICKET_IMPACT_LABELS: Record<string, string> = {
  individual: 'Individual',
  department: 'Departamento',
  organization: 'Organización',
}

export const SUPPORT_LEVEL_LABELS: Record<string, string> = {
  n1: 'Nivel 1 - Soporte Básico',
  n2: 'Nivel 2 - Soporte Avanzado',
  n3: 'Nivel 3 - Soporte Especializado',
}

export const PLAN_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
}

export const PLAN_COLORS: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-slate-100 text-slate-800',
  gold: 'bg-yellow-100 text-yellow-800',
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  pc: 'PC de Escritorio',
  laptop: 'Portátil',
  server: 'Servidor',
  printer: 'Impresora',
  network: 'Equipo de Red',
  mobile: 'Dispositivo Móvil',
  software: 'Software',
  other: 'Otro',
}

export const ASSET_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  maintenance: 'En Mantenimiento',
  retired: 'Retirado',
  disposed: 'Desechado',
}

export const USER_ROLE_LABELS: Record<string, string> = {
  client: 'Cliente',
  technician: 'Técnico',
  admin: 'Administrador',
}

// Ticket categories
export const TICKET_CATEGORIES = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'network', label: 'Redes' },
  { value: 'email', label: 'Correo Electrónico' },
  { value: 'security', label: 'Seguridad' },
  { value: 'access', label: 'Accesos y Permisos' },
  { value: 'backup', label: 'Backup y Recuperación' },
  { value: 'performance', label: 'Rendimiento' },
  { value: 'other', label: 'Otros' },
]

// Knowledge Base categories
export const KB_CATEGORIES = [
  { value: 'getting-started', label: 'Primeros Pasos' },
  { value: 'troubleshooting', label: 'Solución de Problemas' },
  { value: 'how-to', label: 'Guías y Tutoriales' },
  { value: 'faq', label: 'Preguntas Frecuentes' },
  { value: 'policies', label: 'Políticas y Procedimientos' },
  { value: 'best-practices', label: 'Mejores Prácticas' },
]

// SLA thresholds for visual indicators
export const SLA_THRESHOLDS = {
  green: 0.5,    // 50% or less of SLA consumed
  yellow: 0.75,  // 75% of SLA consumed
  red: 1.0,      // 100% SLA consumed (breached)
}

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
