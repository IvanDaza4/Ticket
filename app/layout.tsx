import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

export const metadata: Metadata = {
  title: 'NOVA Support - Soporte IT para PyMEs',
  description: 'Plataforma integral de soporte técnico para pequeñas y medianas empresas. Gestión de tickets, SLAs, base de conocimientos y más.',
  keywords: ['soporte IT', 'helpdesk', 'tickets', 'PyMEs', 'soporte técnico', 'SLA'],
  generator: 'NOVA Support V2',
  icons: {
    icon: [
      {
        url: '/Icon_Nova.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/Icon_Nova.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/Icon_Nova.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/Icon_Nova.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e40af' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
