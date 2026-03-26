import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

// Alias for convenience in route handlers
export const stripe = {
  get customers() { return getStripe().customers },
  get checkout() { return getStripe().checkout },
  get billingPortal() { return getStripe().billingPortal },
  get subscriptions() { return getStripe().subscriptions },
  get webhooks() { return getStripe().webhooks },
} as unknown as Stripe

export const PLANS = {
  FREE: {
    name: 'Gratuit',
    price: 0,
    currency: 'eur',
    protocolsPerMonth: 3,
    features: ['3 protocoles/mois', 'PDF patient', 'Bibliothèque exercices'],
    stripePriceId: null,
  },
  PRO: {
    name: 'Pro',
    price: 2900,
    currency: 'eur',
    protocolsPerMonth: Infinity,
    features: ['Protocoles illimités', 'PDF brandé cabinet', 'Historique complet', 'Export CSV'],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
  CABINET: {
    name: 'Cabinet',
    price: 7900,
    currency: 'eur',
    protocolsPerMonth: Infinity,
    features: ['Tout Pro', '5 comptes kiné', 'Logo cabinet sur PDF', 'Stats cabinet', 'Support prioritaire'],
    stripePriceId: process.env.STRIPE_CABINET_PRICE_ID!,
  },
} as const

export type PlanKey = keyof typeof PLANS
