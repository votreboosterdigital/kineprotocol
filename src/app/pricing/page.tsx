import type { Metadata } from 'next'
import { PLANS } from '@/lib/stripe'
import { PricingCTA } from './PricingCTA'
import { FaqSchema } from '@/components/FaqSchema'

export const metadata: Metadata = {
  title: 'Tarifs — KinéProtocol AI',
  description: 'Choisissez le plan adapté à votre pratique.',
}

const PLAN_DETAILS = [
  {
    key: 'FREE' as const,
    highlight: false,
    badge: null,
    cta: 'Commencer gratuitement',
  },
  {
    key: 'PRO' as const,
    highlight: true,
    badge: 'Le plus populaire',
    cta: 'Choisir Pro',
  },
  {
    key: 'CABINET' as const,
    highlight: false,
    badge: null,
    cta: 'Choisir Cabinet',
  },
]

const pricingFaqs = [
  {
    question: "Peut-on annuler l'abonnement KinéProtocol AI à tout moment ?",
    answer: "Oui, l'abonnement est sans engagement. Vous pouvez annuler depuis votre espace client à tout moment. L'accès reste actif jusqu'à la fin de la période payée."
  },
  {
    question: "KinéProtocol AI est-il remboursable par les OPCO ou organismes de formation ?",
    answer: "KinéProtocol AI est un outil SaaS et non une formation. Il n'est pas éligible aux financements OPCO. Cependant, son coût est déductible en tant que charge professionnelle pour les kinésithérapeutes libéraux."
  },
  {
    question: "Y a-t-il une réduction pour les étudiants en kinésithérapie ?",
    answer: "Contactez-nous pour les conditions tarifaires étudiants. Le plan FREE est accessible sans restriction pour tester la plateforme pendant vos études."
  }
]

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto py-16 px-4 space-y-12">
      <FaqSchema faqs={pricingFaqs} />
      {/* En-tête */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Des tarifs adaptés à votre pratique
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-base">
          Commencez gratuitement, évoluez à votre rythme. Annulation à tout moment.
        </p>
      </div>

      {/* Grille 3 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLAN_DETAILS.map(({ key, highlight, badge, cta }) => {
          const plan = PLANS[key]
          const isFreePlan = key === 'FREE'

          return (
            <div
              key={key}
              className={[
                'relative flex flex-col rounded-2xl border p-6 space-y-6 transition-shadow',
                highlight
                  ? 'border-blue-500 bg-blue-950/40 dark:bg-blue-950/60 shadow-lg shadow-blue-900/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
              ].join(' ')}
            >
              {/* Badge */}
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}

              {/* Nom + prix */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {plan.name}
                </h2>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                    {isFreePlan ? '0' : (plan.price / 100).toFixed(0)}€
                  </span>
                  {!isFreePlan && (
                    <span className="text-slate-500 dark:text-slate-400 mb-1 text-sm">/mois</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {plan.limit === 999
                    ? 'Protocoles illimités'
                    : `${plan.limit} protocoles/mois`}
                </p>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA actif via composant client */}
              <PricingCTA planKey={key} label={cta} highlight={highlight} />
            </div>
          )
        })}
      </div>

      {/* Note bas de page */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-600">
        Paiement sécurisé via Stripe · Facturation en euros · Sans engagement
      </p>
    </div>
  )
}
