import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/billing'
import { prisma } from '@/lib/prisma'
import type { PlanKey } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }
  if (plan === 'FREE') return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })

  const sub = await getUserSubscription(user.id)

  let customerId = sub.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PLANS[plan].stripePriceId!, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/billing`,
    locale: 'fr',
    currency: 'eur',
    metadata: { userId: user.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
