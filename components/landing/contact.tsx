'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react'

export function LandingContact() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <section id="contacto" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-lg text-muted-foreground">
            Solicita una demo personalizada o contacta con nuestro equipo comercial.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Solicitar Demo</CardTitle>
              <CardDescription>
                Completa el formulario y nos pondremos en contacto contigo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">¡Mensaje enviado!</h3>
                  <p className="text-muted-foreground">
                    Nos pondremos en contacto contigo pronto.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input id="name" placeholder="Tu nombre" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input id="company" placeholder="Nombre de la empresa" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@empresa.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" type="tel" placeholder="+34 600 000 000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employees">Número de empleados</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 empleados</SelectItem>
                        <SelectItem value="11-25">11-25 empleados</SelectItem>
                        <SelectItem value="26-50">26-50 empleados</SelectItem>
                        <SelectItem value="51-100">51-100 empleados</SelectItem>
                        <SelectItem value="100+">Más de 100 empleados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Cuéntanos sobre tus necesidades de soporte IT..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar solicitud
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col justify-center space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Información de Contacto
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <a href="mailto:soporte@ingnala.com" className="text-muted-foreground hover:text-accent">
                      soporte@ingnala.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Teléfono</p>
                    <a href="tel:+34900000000" className="text-muted-foreground hover:text-accent">
                      +34 900 000 000
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Oficina</p>
                    <p className="text-muted-foreground">
                      Madrid, España
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2">Horario de Atención</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Nuestro equipo comercial está disponible para atenderte.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Lunes a Viernes: 9:00 - 18:00</li>
                <li>Sábados: 10:00 - 14:00</li>
                <li className="text-accent font-medium">Soporte técnico 24/7 (clientes Gold)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
