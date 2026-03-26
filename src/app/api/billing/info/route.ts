import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canGenerateProtocol } from '@/lib/billing'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const [sub, usage] = await Promise.all([
    getUserSubscription(user.id),
    canGenerateProtocol(user.id),
  ])

  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    stripeCustomerId: sub.stripeCustomerId,
    current: usage.current,
    limit: usage.limit,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  })
}
