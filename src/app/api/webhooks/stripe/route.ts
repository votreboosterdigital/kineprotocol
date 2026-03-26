import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalide' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const { userId, plan } = session.metadata!
      await prisma.subscription.update({
        where: { userId },
        data: {
          plan: plan as 'FREE' | 'PRO' | 'CABINET',
          stripeSubscriptionId: session.subscription as string,
          status: 'ACTIVE',
        },
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const dbSub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: sub.id },
      })
      if (dbSub) {
        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status.toUpperCase() as 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING',
            currentPeriodEnd: sub.items.data[0]
              ? new Date(sub.items.data[0].current_period_end * 1000)
              : undefined,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: 'FREE', status: 'CANCELED', stripeSubscriptionId: null },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
