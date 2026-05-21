import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="transition-transform duration-200 group-hover:scale-105">
            <Image 
              src="/Logo_Nova.png" 
              alt="Nova Logo" 
              width={40} 
              height={40}
              className="h-10 w-10 object-contain"
            />
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#servicios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">
            Servicios
          </Link>
          <Link href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">
            Beneficios
          </Link>
          <Link href="#planes" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">
            Planes
          </Link>
          <Link href="#contacto" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="hidden sm:inline-flex hover:bg-primary/10 hover:text-primary transition-colors duration-200">
            <Link href="/auth/login">Iniciar Sesion</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-primary/40">
            <Link href="/auth/login">Acceso Clientes</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
