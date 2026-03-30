'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/stripe'

type PlanKey = 'FREE' | 'PRO' | 'CABINET'

interface BillingInfo {
  plan: PlanKey
  status: string
  current: number
  limit: number
  stripeCustomerId: string | null
}

const PLAN_BADGE: Record<PlanKey, string> = {
  FREE: 'bg-slate-100 text-slate-700',
  PRO: 'bg-blue-100 text-blue-700',
  CABINET: 'bg-purple-100 text-purple-700',
}

export default function BillingPage() {
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch('/api/billing/info').then(r => r.json()).then(setInfo).finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(plan: PlanKey) {
    setCheckoutLoading(plan)
    const res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.assign(data.url)
    setCheckoutLoading(null)
  }

  async function handlePortal() {
    setPortalLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.assign(data.url)
    setPortalLoading(false)
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>

  const currentPlan = info?.plan ?? 'FREE'

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturation</h1>
          <p className="text-slate-500 mt-1">Gérez votre abonnement KinéProtocol AI</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Plan actuel :</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${PLAN_BADGE[currentPlan]}`}>
            {PLANS[currentPlan].name}
          </span>
        </div>
      </div>

      {currentPlan === 'FREE' && info && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-700">
            Protocoles ce mois-ci : <span className="font-bold">{info.current}/{info.limit}</span>
          </p>
          <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min((info.current / info.limit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => {
          const isCurrent = currentPlan === key

          return (
            <Card key={key} className={`relative ${key === 'PRO' ? 'border-blue-500 border-2' : ''}`}>
              {key === 'PRO' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-blue-500 text-white text-xs px-3 py-1 shadow-md">Recommandé</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold">Gratuit</span>
                  ) : (
                    <span className="text-3xl font-bold">
                      {(plan.price / 100).toFixed(0)}€<span className="text-base font-normal text-slate-500">/mois</span>
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button className="w-full" variant="outline" disabled>
                    Plan actuel
                  </Button>
                ) : key === 'FREE' ? (
                  <Button className="w-full" variant="outline" disabled>
                    Rétrograder
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(key)}
                    disabled={checkoutLoading === key}
                  >
                    {checkoutLoading === key ? 'Redirection...' : `Passer au ${plan.name} — ${(plan.price / 100).toFixed(0)}€/mois`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {info?.stripeCustomerId && (
        <div className="border-t pt-6">
          <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
            {portalLoading ? 'Redirection...' : 'Gérer mon abonnement →'}
          </Button>
          <p className="text-xs text-slate-500 mt-2">Annulation, changement de carte, historique des paiements</p>
        </div>
      )}
    </div>
  )
}
