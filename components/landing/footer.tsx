import Link from 'next/link'
import { Headset } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-sidebar-primary p-2 rounded-lg">
                <Headset className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Ingnala</span>
            </Link>
            <p className="text-sm text-sidebar-foreground/70">
              Soporte IT profesional para pequeñas y medianas empresas. Tu tranquilidad tecnológica.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link href="#servicios" className="hover:text-sidebar-foreground transition-colors">Soporte Nivel 1</Link></li>
              <li><Link href="#servicios" className="hover:text-sidebar-foreground transition-colors">Soporte Nivel 2</Link></li>
              <li><Link href="#servicios" className="hover:text-sidebar-foreground transition-colors">Soporte Nivel 3</Link></li>
              <li><Link href="#planes" className="hover:text-sidebar-foreground transition-colors">Planes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link href="#" className="hover:text-sidebar-foreground transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="#contacto" className="hover:text-sidebar-foreground transition-colors">Contacto</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground transition-colors">Carreras</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link href="#" className="hover:text-sidebar-foreground transition-colors">Política de Privacidad</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground transition-colors">Términos de Servicio</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground transition-colors">Cookies</Link></li>
              <li><Link href="#" className="hover:text-sidebar-foreground transition-colors">RGPD</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-sidebar-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sidebar-foreground/70">
            © {new Date().getFullYear()} Ingnala Support. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </Link>
            <Link href="#" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
