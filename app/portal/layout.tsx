import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortalSidebar } from '@/components/layout/portal-sidebar'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, organization:organizations(name)')
    .eq('id', user.id)
    .single()

  const userName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email || user.email || 'Usuario'

  return (
    <div className="flex min-h-screen bg-background">
      <PortalSidebar 
        user={{
          name: userName,
          email: user.email || '',
          organization: (profile?.organization as { name: string } | null)?.name,
        }}
      />
      <main className="flex-1 ml-0 md:ml-64 overflow-auto pt-14 md:pt-0 pb-6">
        {children}
      </main>
    </div>
  )
}
