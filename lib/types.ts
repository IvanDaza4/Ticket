// Database types for NOVA Support V2

export type UserRole = 'client' | 'technician' | 'admin'
export type PlanTier = 'bronze' | 'silver' | 'gold'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_client' | 'waiting_provider' | 'resolved' | 'closed'
export type TicketUrgency = 'low' | 'medium' | 'high' | 'critical'
export type TicketImpact = 'individual' | 'department' | 'organization'
export type SupportLevel = 'n1' | 'n2' | 'n3'
export type AssetType = 'pc' | 'laptop' | 'server' | 'printer' | 'network' | 'mobile' | 'software' | 'other'
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'disposed'

export interface Organization {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  plan: PlanTier
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string
  logo_url: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  organization_id: string | null
  role: UserRole
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  job_title: string | null
  department: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
  organization?: Organization
}

export interface Contract {
  id: string
  organization_id: string
  name: string
  plan: PlanTier
  start_date: string
  end_date: string | null
  monthly_hours: number | null
  hourly_rate: number | null
  monthly_fee: number | null
  includes_n1: boolean
  includes_n2: boolean
  includes_n3: boolean
  business_hours_start: string
  business_hours_end: string
  business_days: number[]
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  organization?: Organization
}

export interface SLADefinition {
  id: string
  plan: PlanTier
  urgency: TicketUrgency
  impact: TicketImpact
  response_time_minutes: number
  resolution_time_minutes: number
  created_at: string
}

export interface Ticket {
  id: string
  ticket_number: number
  organization_id: string
  created_by: string
  assigned_to: string | null
  asset_id: string | null
  subject: string
  description: string
  status: TicketStatus
  urgency: TicketUrgency
  impact: TicketImpact
  support_level: SupportLevel
  priority_score: number
  sla_response_deadline: string | null
  sla_resolution_deadline: string | null
  first_response_at: string | null
  resolved_at: string | null
  closed_at: string | null
  sla_paused_at: string | null
  sla_pause_duration_minutes: number
  tags: string[] | null
  is_sla_breached: boolean
  category: string | null
  subcategory: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  organization?: Organization
  creator?: Profile
  assignee?: Profile
  asset?: Asset
  comments?: TicketComment[]
}

export interface TicketComment {
  id: string
  ticket_id: string
  author_id: string
  content: string
  is_internal: boolean
  attachments: Attachment[]
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Attachment {
  name: string
  url: string
  type: string
  size: number
}

export interface TicketHistory {
  id: string
  ticket_id: string
  changed_by: string | null
  field_name: string
  old_value: string | null
  new_value: string | null
  change_type: string
  created_at: string
  changer?: Profile
}

export interface Asset {
  id: string
  organization_id: string
  name: string
  asset_type: AssetType
  status: AssetStatus
  serial_number: string | null
  manufacturer: string | null
  model: string | null
  purchase_date: string | null
  warranty_expiry: string | null
  assigned_to: string | null
  location: string | null
  ip_address: string | null
  mac_address: string | null
  specifications: Record<string, unknown>
  notes: string | null
  created_at: string
  updated_at: string
  organization?: Organization
  assignee?: Profile
}

export interface KnowledgeBaseArticle {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  category: string
  subcategory: string | null
  tags: string[] | null
  is_public: boolean
  is_published: boolean
  view_count: number
  helpful_count: number
  author_id: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  author?: Profile
}

export interface CSATSurvey {
  id: string
  ticket_id: string
  respondent_id: string | null
  rating: number
  comment: string | null
  responded_at: string
  created_at: string
  ticket?: Ticket
  respondent?: Profile
}

export interface TechnicianSpecialty {
  id: string
  profile_id: string
  specialty: string
  proficiency_level: number
  created_at: string
  technician?: Profile
}

// Dashboard Statistics
export interface DashboardStats {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  avgResolutionTime: number
  slaComplianceRate: number
  csatScore: number
  ticketsByStatus: Record<TicketStatus, number>
  ticketsByUrgency: Record<TicketUrgency, number>
}

// Ticket filters
export interface TicketFilters {
  status?: TicketStatus[]
  urgency?: TicketUrgency[]
  assignedTo?: string
  organizationId?: string
  supportLevel?: SupportLevel[]
  dateFrom?: string
  dateTo?: string
  search?: string
}
