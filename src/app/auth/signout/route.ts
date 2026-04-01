import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Fallback GET (évite le 405 si un lien navigue vers cette route)
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/landing', request.url))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/landing', request.url))
}
