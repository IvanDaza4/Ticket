import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Bronze',
    description: 'Ideal para pequeñas empresas que inician',
    price: '299',
    period: '/mes',
    features: [
      'Hasta 10 usuarios',
      'Soporte Nivel 1',
      'Horario laboral (9-18h)',
      'Tiempo respuesta: 4h',
      'Portal de tickets',
      'Base de conocimientos',
    ],
    cta: 'Comenzar',
    popular: false,
  },
  {
    name: 'Silver',
    description: 'Para empresas en crecimiento',
    price: '599',
    period: '/mes',
    features: [
      'Hasta 25 usuarios',
      'Soporte Nivel 1 y 2',
      'Horario extendido (8-20h)',
      'Tiempo respuesta: 2h',
      'Portal de tickets',
      'Base de conocimientos',
      'Inventario de activos',
      'Reportes mensuales',
    ],
    cta: 'Comenzar',
    popular: true,
  },
  {
    name: 'Gold',
    description: 'Solución completa para empresas',
    price: '999',
    period: '/mes',
    features: [
      'Usuarios ilimitados',
      'Soporte Nivel 1, 2 y 3',
      'Soporte 24/7',
      'Tiempo respuesta: 30min',
      'Portal de tickets',
      'Base de conocimientos',
      'Inventario de activos',
      'Dashboard ejecutivo',
      'Técnico dedicado',
      'Consultoría IT incluida',
    ],
    cta: 'Contactar',
    popular: false,
  },
]

export function LandingPlans() {
  return (
    <section id="planes" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Planes y Precios
          </h2>
          <p className="text-lg text-muted-foreground">
            Elige el plan que mejor se adapte a las necesidades de tu empresa. Todos incluyen soporte técnico profesional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative flex flex-col ${
                plan.popular 
                  ? 'border-accent shadow-lg scale-105' 
                  : 'border-border/50'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent hover:bg-accent text-accent-foreground">
                  Recomendado
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}€</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/auth/sign-up">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          ¿Necesitas un plan personalizado? <Link href="#contacto" className="text-accent hover:underline">Contáctanos</Link>
        </p>
      </div>
    </section>
  )
}
