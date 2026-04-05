import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export async function POST(req: NextRequest): Promise<NextResponse> {
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

      // Récupère la subscription Stripe pour avoir currentPeriodEnd immédiatement
      let currentPeriodEnd: Date | undefined
      if (session.subscription) {
        const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string)
        const item = stripeSub.items.data[0]
        if (item) currentPeriodEnd = new Date(item.current_period_end * 1000)
      }

      await prisma.subscription.update({
        where: { userId },
        data: {
          plan: plan as 'FREE' | 'PRO' | 'CABINET',
          stripeSubscriptionId: session.subscription as string,
          status: 'ACTIVE',
          ...(currentPeriodEnd && { currentPeriodEnd }),
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

    // Paiement échoué — passe en PAST_DUE pour bloquer l'accès aux features payantes
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // API v2026-03-25 : subscription est dans parent.subscription_details.subscription
      const subId = invoice.parent?.subscription_details?.subscription
      if (subId) {
        const subscriptionId = typeof subId === 'string' ? subId : subId.id
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'PAST_DUE' },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
