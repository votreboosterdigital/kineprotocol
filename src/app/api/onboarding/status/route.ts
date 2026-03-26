import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } })

  return NextResponse.json({ onboardingCompleted: profile?.onboardingCompleted ?? false })
}
