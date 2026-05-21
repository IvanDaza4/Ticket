'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard,
  Inbox,
  Ticket,
  Building2,
  FileText,
  Users,
  BookOpen,
  Monitor,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Menu,
  UserCog,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { MessageBadge } from '@/components/messages/message-badge'

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bandeja de Entrada', href: '/admin/inbox', icon: Inbox },
  { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
  { name: 'Mensajes', href: '/admin/messages', icon: MessageSquare, hasBadge: true },
  { name: 'Clientes', href: '/admin/clients', icon: Building2 },
  { name: 'Contratos', href: '/admin/contracts', icon: FileText },
  { name: 'Usuarios', href: '/admin/users', icon: UserCog },
  { name: 'Tecnicos', href: '/admin/technicians', icon: Users },
  { name: 'Base de Conocimientos', href: '/admin/knowledge-base', icon: BookOpen },
  { name: 'Activos', href: '/admin/assets', icon: Monitor },
  { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
]

const technicianNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bandeja de Entrada', href: '/admin/inbox', icon: Inbox },
  { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
  { name: 'Mensajes', href: '/admin/messages', icon: MessageSquare, hasBadge: true },
  { name: 'Activos', href: '/admin/assets', icon: Monitor },
]

interface AdminSidebarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

interface AdminNavContentProps {
  isMobile?: boolean
  navigation: typeof adminNavigation
  pathname: string
  collapsed: boolean
  setMobileOpen: (v: boolean) => void
  user: AdminSidebarProps['user']
  handleLogout: () => void
}

function AdminNavContent({
  isMobile = false,
  navigation,
  pathname,
  collapsed,
  setMobileOpen,
  user,
  handleLogout,
}: AdminNavContentProps) {
  return (
    <>
      <nav className={cn('flex-1 px-2 py-4 space-y-1 overflow-y-auto', isMobile && 'px-4')}>
        {navigation.map((item, index) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              style={{ animationDelay: `${index * 50}ms` }}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:translate-x-1',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm shadow-primary/10'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                isMobile && 'py-3 animate-slide-in-right'
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
                {(item as any).hasBadge && <MessageBadge />}
              </div>
              {(isMobile || !collapsed) && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className={cn('border-t border-sidebar-border p-4', isMobile && 'mt-auto')}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/20">
            <User className="h-5 w-5 text-sidebar-foreground" />
          </div>
          {(isMobile || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                {user.role === 'admin' ? 'Administrador' : 'Tecnico'}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors duration-200',
            isMobile || !collapsed ? 'w-full justify-start' : 'w-full justify-center px-0'
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {(isMobile || !collapsed) && <span className="ml-2">Cerrar Sesion</span>}
        </Button>
      </div>
    </>
  )
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigation = user.role === 'admin' ? adminNavigation : technicianNavigation

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <d{/* Logo */}
      <div className={cn("flex items-center justify-center border-b border-sidebar-border py-4", isMobile && "px-4")}>
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/Logo_Nova.png"
            alt="Nova Logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          {(isMobile || !collapsed) && (
            <span className="text-sm font-bold text-sidebar-foreground"></span>
          )}
        </Link>
      </div>


      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 h-screen bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border transition-all duration-300 z-50',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={cn("flex items-center justify-center border-b border-sidebar-border py-4", isMobile && "px-4")}>
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/Logo_Nova.png"
              alt="Nova Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            {(isMobile || !collapsed) && (
              <span className="text-sm font-bold text-sidebar-foreground"></span>
            )}
          </Link>
        </div>
        <AdminNavContent
          navigation={navigation}
          pathname={pathname}
          collapsed={collapsed}
          setMobileOpen={setMobileOpen}
          user={user}
          handleLogout={handleLogout}
        />
      </aside>
    </>
  )
}
