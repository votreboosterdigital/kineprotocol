'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function OnboardingModal() {
  const [step, setStep] = useState(0)

  const steps = [
    { icon: '🧠', label: 'Agent Protocol Designer au travail...' },
    { icon: '📚', label: 'Agent Exercise Librarian enrichit les exercices...' },
    { icon: '✍️', label: 'Agent Patient Writer rédige votre document...' },
  ]

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 8000),
      setTimeout(() => setStep(2), 15000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-bold">Bienvenue !</h2>
          <p className="text-slate-500 text-sm">Génération de votre premier protocole de démo...</p>
        </div>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                i === step
                  ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                  : i < step
                  ? 'opacity-50'
                  : 'opacity-30'
              }`}
            >
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-medium">{s.label}</span>
              {i < step && <span className="ml-auto text-green-500 text-sm">✓</span>}
              {i === step && (
                <span className="ml-auto">
                  <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-[progress_20s_linear_forwards]" />
          </div>
          <p className="text-xs text-slate-400 text-center">Génération en cours (~20 secondes)</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    async function checkOnboarding() {
      const res = await fetch('/api/onboarding/status')
      if (!res.ok) return
      const { onboardingCompleted } = await res.json()
      if (!onboardingCompleted) {
        setShowOnboarding(true)
        const demoRes = await fetch('/api/onboarding/demo', { method: 'POST' })
        if (demoRes.ok) {
          const { protocolId } = await demoRes.json()
          setShowOnboarding(false)
          router.push(`/protocols/${protocolId}?demo=true`)
        } else {
          setShowOnboarding(false)
        }
      }
    }
    checkOnboarding()
  }, [router])

  return (
    <>
      {showOnboarding && <OnboardingModal />}
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
