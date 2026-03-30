import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/billing'
import { getAppUrl } from '@/lib/app-url'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sub = await getUserSubscription(user.id)
  if (!sub.stripeCustomerId) {
    return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${getAppUrl(req)}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
