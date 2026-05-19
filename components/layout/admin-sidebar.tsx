'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  Headset,
  ChevronLeft,
  ChevronRight,
  User,
  Menu,
  UserCog,
  MessageSquare

} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <nav className={cn("flex-1 px-2 py-4 space-y-1 overflow-y-auto", isMobile && "px-4")}>
        {navigation.map((item, index) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              style={{ animationDelay: `${index * 50}ms` }}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:translate-x-1",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30 shadow-sm shadow-primary/10"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                isMobile && "py-3 animate-slide-in-right"
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                {(item as any).hasBadge && <MessageBadge />}
              </div>
              {(isMobile || !collapsed) && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className={cn("border-t border-sidebar-border p-4", isMobile && "mt-auto")}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/20">
            <User className="h-5 w-5 text-sidebar-foreground" />
          </div>
          {(isMobile || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
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
            "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors duration-200",
            (isMobile || !collapsed) ? "w-full justify-start" : "w-full justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {(isMobile || !collapsed) && <span className="ml-2">Cerrar Sesion</span>}
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border flex items-center justify-between px-4 z-40">
        <Link href="/admin" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-br from-primary to-primary/70 p-1.5 rounded-lg shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
            <Headset className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">NOVA</span>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent/50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar/95 backdrop-blur-md border-sidebar-border">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-primary to-primary/70 p-1.5 rounded-lg shadow-lg shadow-primary/20">
                    <Headset className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold text-sidebar-foreground">NOVA</span>
                </Link>
              </div>
              <NavContent isMobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col fixed left-0 top-0 h-screen bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border transition-all duration-300 z-50"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-primary to-primary/70 p-1.5 rounded-lg shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
              <Headset className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-sidebar-foreground">NOVA</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <NavContent />
      </aside>
    </>
  )
}