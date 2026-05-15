import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Headphones, Wrench, Server } from 'lucide-react'

const services = [
  {
    icon: Headphones,
    title: 'Nivel 1 - Soporte Básico',
    description: 'Atención inmediata para incidencias comunes. Resolución de problemas de usuario, configuraciones básicas y soporte remoto.',
    features: [
      'Atención telefónica y por chat',
      'Resolución de incidencias comunes',
      'Configuración de equipos',
      'Soporte de software básico',
    ],
  },
  {
    icon: Wrench,
    title: 'Nivel 2 - Soporte Avanzado',
    description: 'Solución de problemas técnicos complejos. Diagnóstico avanzado, reparaciones y optimización de sistemas.',
    features: [
      'Diagnóstico avanzado',
      'Reparación de hardware',
      'Optimización de sistemas',
      'Gestión de redes',
    ],
  },
  {
    icon: Server,
    title: 'Nivel 3 - Soporte Especializado',
    description: 'Consultoría y proyectos especiales. Arquitectura de sistemas, migraciones y soluciones empresariales.',
    features: [
      'Arquitectura de infraestructura',
      'Migraciones y actualizaciones',
      'Proyectos especiales',
      'Consultoría IT estratégica',
    ],
  },
]

export function LandingServices() {
  return (
    <section id="servicios" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Niveles de Soporte
          </h2>
          <p className="text-lg text-muted-foreground">
            Tres niveles de servicio diseñados para cubrir todas las necesidades de soporte técnico de tu empresa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <Card key={index} className="relative overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription className="text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
