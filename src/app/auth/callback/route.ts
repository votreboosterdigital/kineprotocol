import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')

  /* Gestion erreur OTP expiré */
  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=invalid_token`)
  }

  const userId = sessionData.user?.id
  if (!userId) {
    return NextResponse.redirect(`${origin}/login`)
  }

  /* Redirect intelligent : /protocols/new si aucun protocole, sinon dashboard */
  try {
    const count = await prisma.protocol.count({ where: { userId } })
    if (count === 0) {
      return NextResponse.redirect(`${origin}/protocols/new`)
    }
  } catch (e) {
    console.error('[auth/callback] protocol count error:', e)
    /* Fallback : dashboard */
  }

  return NextResponse.redirect(`${origin}/`)
}
