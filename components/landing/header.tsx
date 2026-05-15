import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Headset, Menu, X } from 'lucide-react'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Headset className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Ingnala</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#servicios" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Servicios
          </Link>
          <Link href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Beneficios
          </Link>
          <Link href="#planes" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Planes
          </Link>
          <Link href="#contacto" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/auth/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/login">Acceso Clientes</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
