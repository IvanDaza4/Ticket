import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile and check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role')
    .eq('id', user.id)
    .single()

  // Only allow technicians and admins
  if (profile?.role === 'client') {
    redirect('/portal')
  }

  const userName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email || user.email || 'Usuario'

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar 
        user={{
          name: userName,
          email: user.email || '',
          role: profile?.role || 'technician',
        }}
      />
      <main className="flex-1 ml-0 md:ml-64 overflow-auto pt-14 md:pt-0 pb-6">
        {children}
      </main>
    </div>
  )
}
