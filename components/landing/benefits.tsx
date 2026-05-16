import { Clock, Users, BarChart3, Shield, Zap, HeartHandshake } from 'lucide-react'

const benefits = [
  {
    icon: Clock,
    title: 'Respuesta Inmediata',
    description: 'SLAs definidos con tiempos de respuesta garantizados según la urgencia de cada incidencia.',
  },
  {
    icon: Users,
    title: 'Equipo Dedicado',
    description: 'Técnicos especializados asignados a tu cuenta que conocen tu infraestructura y necesidades.',
  },
  {
    icon: BarChart3,
    title: 'Reportes y Métricas',
    description: 'Dashboard ejecutivo con KPIs, tendencias y análisis para tomar decisiones informadas.',
  },
  {
    icon: Shield,
    title: 'Seguridad Garantizada',
    description: 'Protocolos de seguridad estrictos y cumplimiento normativo para proteger tus datos.',
  },
  {
    icon: Zap,
    title: 'Resolución Eficiente',
    description: 'Base de conocimientos y procesos optimizados para resolver incidencias rápidamente.',
  },
  {
    icon: HeartHandshake,
    title: 'Atención Personalizada',
    description: 'Servicio adaptado a las necesidades específicas de cada cliente y sector.',
  },
]

export function LandingBenefits() {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            ¿Por qué elegir NOVA?
          </h2>
          <p className="text-lg text-muted-foreground">
            Beneficios que marcan la diferencia en el soporte técnico de tu empresa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <benefit.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
