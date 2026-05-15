import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Shield, Zap } from 'lucide-react'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="orb-float absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="orb-float-reverse absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        <div className="orb-float-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-6">
            <Shield className="h-4 w-4" />
            <span>Soporte IT de confianza para PyMEs</span>
          </div>
          
          <h1 className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-6">
            Tu equipo de soporte técnico, siempre disponible
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 text-pretty">
            Gestiona incidencias, controla SLAs y mantén tu infraestructura funcionando 
            con nuestra plataforma integral de soporte IT diseñada para pequeñas y medianas empresas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" asChild className="text-base">
              <Link href="/auth/sign-up">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base">
              <Link href="#planes">Ver Planes</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>Sin compromiso inicial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>Soporte 24/7 disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>SLAs garantizados</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
