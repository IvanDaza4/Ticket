import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Get user role from profile if logged in
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role || null
  }

  // Protected routes configuration
  const portalRoutes = pathname.startsWith('/portal')
  const adminRoutes = pathname.startsWith('/admin')
  const authRoutes = pathname.startsWith('/auth')

  // If not logged in and trying to access protected routes
  if (!user && (portalRoutes || adminRoutes)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // If logged in and trying to access auth routes
  if (user && authRoutes && !pathname.includes('/callback')) {
    const url = request.nextUrl.clone()
    // Redirect based on role
    if (userRole === 'admin' || userRole === 'technician') {
      url.pathname = '/admin'
    } else {
      url.pathname = '/portal'
    }
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user && adminRoutes && userRole === 'client') {
    // Clients cannot access admin routes
    const url = request.nextUrl.clone()
    url.pathname = '/portal'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
