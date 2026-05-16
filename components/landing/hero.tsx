import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Shield, Zap, Sparkles } from 'lucide-react'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-primary/5 py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary mb-6 hover-lift">
            <Shield className="h-4 w-4" />
            <span>Soporte IT de confianza para PyMEs</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance mb-6">
            Tu equipo de soporte tecnico,{' '}
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              siempre disponible
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 text-pretty leading-relaxed">
            Gestiona incidencias, controla SLAs y manten tu infraestructura funcionando 
            con nuestra plataforma integral de soporte IT disenada para pequenas y medianas empresas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" asChild className="text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/auth/sign-up">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200">
              <Link href="#planes">Ver Planes</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 transition-colors duration-200 hover:text-foreground">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>Sin compromiso inicial</span>
            </div>
            <div className="flex items-center gap-2 transition-colors duration-200 hover:text-foreground">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>Soporte 24/7 disponible</span>
            </div>
            <div className="flex items-center gap-2 transition-colors duration-200 hover:text-foreground">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>SLAs garantizados</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
