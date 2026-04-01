import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() lit le JWT du cookie sans appel réseau — fiable en edge
  // Si un code PKCE est dans l'URL, rediriger vers /auth/callback pour l'échanger
  const pkceCode = request.nextUrl.searchParams.get('code')
  if (pkceCode && !request.nextUrl.pathname.startsWith('/auth')) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('code', pkceCode)
    return NextResponse.redirect(callbackUrl)
  }

  const { data: { session } } = await supabase.auth.getSession()

  const isPublic =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/landing') ||
    request.nextUrl.pathname.startsWith('/demo') ||
    request.nextUrl.pathname.startsWith('/pricing') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/api')

  if (!session && !isPublic) {
    const landingUrl = request.nextUrl.clone()
    landingUrl.pathname = '/landing'
    const redirectResponse = NextResponse.redirect(landingUrl)
    // Copier les cookies Supabase dans la réponse de redirection
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) => {
      redirectResponse.cookies.set(name, value, opts as Parameters<typeof redirectResponse.cookies.set>[2])
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
