'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function OnboardingToast({ protocolId }: { protocolId: string | null }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [minimized, setMinimized] = useState(false)

  const steps = [
    { icon: '🧠', label: 'Protocol Designer au travail...' },
    { icon: '📚', label: 'Exercise Librarian enrichit...' },
    { icon: '✍️', label: 'Patient Writer rédige...' },
  ]

  useEffect(() => {
    if (protocolId) return
    const timers = [
      setTimeout(() => setStep(1), 25000),
      setTimeout(() => setStep(2), 70000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [protocolId])

  // Protocole prêt
  if (protocolId) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-slate-900 shadow-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Protocole démo prêt !</p>
            <p className="text-xs text-slate-500">Votre premier protocole a été généré.</p>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={() => router.push(`/protocols/${protocolId}?demo=true`)}
        >
          Voir le protocole →
        </Button>
      </div>
    )
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 text-white px-4 py-2 shadow-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Génération en cours...
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Génération de votre démo</p>
          <p className="text-xs text-slate-400">Continuez à explorer pendant ce temps</p>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
          aria-label="Réduire"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
              i === step
                ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                : i < step
                ? 'opacity-40'
                : 'opacity-20'
            }`}
          >
            <span>{s.icon}</span>
            <span className="font-medium flex-1">{s.label}</span>
            {i < step && <span className="text-green-500">✓</span>}
            {i === step && (
              <svg className="animate-spin h-3 w-3 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">~2 min · votre protocole apparaîtra ici</p>
    </div>
  )
}

export default function DashboardPage() {
  const [showToast, setShowToast] = useState(false)
  const [protocolId, setProtocolId] = useState<string | null>(null)

  useEffect(() => {
    async function checkOnboarding() {
      const res = await fetch('/api/onboarding/status')
      if (!res.ok) return
      const { onboardingCompleted } = await res.json()
      if (!onboardingCompleted) {
        setShowToast(true)
        const demoRes = await fetch('/api/onboarding/demo', { method: 'POST' })
        if (demoRes.ok) {
          const { protocolId: id } = await demoRes.json()
          setProtocolId(id)
        } else {
          setShowToast(false)
        }
      }
    }
    checkOnboarding()
  }, [])

  return (
    <>
      {showToast && <OnboardingToast protocolId={protocolId} />}

      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-slate-500 mt-1">Vos protocoles de rééducation générés par IA</p>
          </div>
          <Link href="/protocols/new">
            <Button>Nouveau protocole</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Nouvelle génération</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/protocols/new">
                <Button className="w-full">Créer un protocole</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Mes protocoles</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/protocols">
                <Button variant="outline" className="w-full">Voir tous mes protocoles</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Abonnement</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/billing">
                <Button variant="outline" className="w-full">Gérer mon plan</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
