import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateDemoProtocol } from '@/lib/onboarding'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } })
  if (profile?.onboardingCompleted) {
    return NextResponse.json({ error: 'Onboarding déjà complété' }, { status: 400 })
  }

  const protocolId = await generateDemoProtocol(user.id)
  return NextResponse.json({ success: true, protocolId })
}
