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
    limit: 3,
    protocolsPerMonth: 3,
    features: ['3 protocoles/mois', 'PDF patient', 'Bibliothèque exercices'],
    priceId: null as null,
    stripePriceId: null as null,
  },
  PRO: {
    name: 'Pro',
    price: 2900,
    currency: 'eur',
    limit: 50,
    protocolsPerMonth: 50,
    features: ['Protocoles illimités', 'PDF brandé cabinet', 'Historique complet', 'Export CSV'],
    priceId: 'price_1TFLsYPWeiebKSoAwDFe3kaF',
    stripePriceId: 'price_1TFLsYPWeiebKSoAwDFe3kaF',
  },
  CABINET: {
    name: 'Cabinet',
    price: 7900,
    currency: 'eur',
    limit: 999,
    protocolsPerMonth: 999,
    features: ['Tout Pro', '5 comptes kiné', 'Logo cabinet sur PDF', 'Stats cabinet', 'Support prioritaire'],
    priceId: 'price_1TFLv2PWeiebKSoAgmKQl4hd',
    stripePriceId: 'price_1TFLv2PWeiebKSoAgmKQl4hd',
  },
} as const

export type PlanKey = keyof typeof PLANS
// Alias pour la compatibilité avec usage.ts
export type PlanType = PlanKey
