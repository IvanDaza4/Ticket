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
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bandeja de Entrada', href: '/admin/inbox', icon: Inbox },
  { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
  { name: 'Clientes', href: '/admin/clients', icon: Building2 },
  { name: 'Contratos', href: '/admin/contracts', icon: FileText },
  { name: 'Tecnicos', href: '/admin/technicians', icon: Users },
  { name: 'Base de Conocimientos', href: '/admin/knowledge-base', icon: BookOpen },
  { name: 'Activos', href: '/admin/assets', icon: Monitor },
  { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
]

const technicianNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bandeja de Entrada', href: '/admin/inbox', icon: Inbox },
  { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
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

  // Close mobile menu on route change
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
      {/* Navigation */}
      <nav className={cn("flex-1 px-2 py-4 space-y-1 overflow-y-auto", isMobile && "px-4")}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                isMobile && "py-3"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(isMobile || !collapsed) && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-sidebar-border p-4", isMobile && "mt-auto")}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-sidebar-primary" />
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
            "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="bg-sidebar-primary p-1.5 rounded-lg">
            <Headset className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Ingnala</span>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="bg-sidebar-primary p-1.5 rounded-lg">
                    <Headset className="h-5 w-5 text-sidebar-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold text-sidebar-foreground">Ingnala</span>
                </Link>
              </div>
              <NavContent isMobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative group",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Expand hitbox when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute inset-y-0 -right-3 w-6 z-50 cursor-pointer hover:bg-sidebar-accent/20 transition-colors"
            aria-label="Expandir menu"
          />
        )}
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-sidebar-primary p-1.5 rounded-lg">
              <Headset className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-sidebar-foreground">Ingnala</span>
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
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
