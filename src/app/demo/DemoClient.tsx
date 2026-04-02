'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const DEMO_PROTOCOLS = [
  {
    id: 'demo-1',
    pathologie: 'Lombalgie chronique',
    phase: 'Phase 2 — Renforcement',
    duree: '6 semaines',
    seances: '3×/semaine',
    intensite: 'Modérée',
    exercices: [
      { num: 1, nom: 'Stabilisation lombaire active', params: '3 × 12 rép. · Repos 60s', niveau: 'low' },
      { num: 2, nom: 'Gainage antérieur progressif', params: '3 × 30s · Progression J+7', niveau: 'mid' },
      { num: 3, nom: 'Mobilisation lombopelvienne', params: '2 × 15 rép. · Amplitude contrôlée', niveau: 'low' },
      { num: 4, nom: 'Renforcement ischio-jambiers', params: '3 × 10 rép. · Charge progressive', niveau: 'mid' },
    ],
  },
  {
    id: 'demo-2',
    pathologie: 'Entorse de cheville grade 2',
    phase: 'Phase 1 — Décharge partielle',
    duree: '3 semaines',
    seances: '4×/semaine',
    intensite: 'Légère',
    exercices: [
      { num: 1, nom: 'Mobilisation passive tibio-tarsienne', params: '3 × 10 rép. · Douleur < 3/10', niveau: 'low' },
      { num: 2, nom: 'Renforcement isométrique péroniers', params: '3 × 15s · Sans douleur', niveau: 'low' },
      { num: 3, nom: 'Proprioception statique unipodal', params: '3 × 30s · Yeux ouverts', niveau: 'mid' },
    ],
  },
  {
    id: 'demo-3',
    pathologie: 'Tendinopathie rotulienne',
    phase: 'Phase 3 — Retour au sport',
    duree: '4 semaines',
    seances: '3×/semaine',
    intensite: 'Élevée',
    exercices: [
      { num: 1, nom: 'Squat déclive excentrique', params: '3 × 15 rép. · Charge progressive', niveau: 'high' },
      { num: 2, nom: 'Fente avant avec charge', params: '4 × 10 rép. · Chaque côté', niveau: 'high' },
      { num: 3, nom: 'Saut avec réception contrôlée', params: '3 × 8 rép. · Absorption maximale', niveau: 'high' },
    ],
  },
]

const NIVEAU_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: 'rgba(0,200,150,0.08)', text: '#00C896' },
  mid: { bg: 'rgba(234,179,8,0.1)', text: '#eab308' },
  high: { bg: 'rgba(239,68,68,0.1)', text: '#f87171' },
}

export function DemoClient() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    /* Tracking analytics non bloquant */
    import('@/lib/analytics').then(({ trackEvent }) => {
      trackEvent.demoViewed()
    }).catch(() => {})
  }, [])

  const protocol = DEMO_PROTOCOLS[active]

  return (
    <div className="min-h-screen" style={{ background: '#080A0F', color: '#EDF2F8' }}>
      {/* Nav minimaliste */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(8,10,15,0.9)', borderBottom: '1px solid #1D2333', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <span className="font-display font-bold text-[15px]" style={{ color: '#EDF2F8' }}>KinéProtocol</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896' }}>AI</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all btn-shimmer"
            style={{ color: '#080A0F' }}
          >
            Créer mon compte →
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* En-tête */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.2)', color: '#00C896' }}>
            Mode démo — données fictives
          </div>
          <h1 className="font-display font-bold text-3xl" style={{ color: '#EDF2F8' }}>
            Exemples de protocoles générés
          </h1>
          <p className="text-sm max-w-lg mx-auto" style={{ color: '#A8B4C8' }}>
            Voici ce que KinéProtocol AI génère en 30 secondes à partir d&apos;une pathologie et d&apos;une phase de rééducation.
          </p>
        </div>

        {/* Sélecteur de protocoles */}
        <div className="flex gap-3 mb-8 flex-wrap justify-center">
          {DEMO_PROTOCOLS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={active === i ? {
                background: 'rgba(0,200,150,0.15)',
                border: '1px solid rgba(0,200,150,0.4)',
                color: '#00C896',
              } : {
                background: '#0C0F17',
                border: '1px solid #1D2333',
                color: '#A8B4C8',
              }}
            >
              {p.pathologie}
            </button>
          ))}
        </div>

        {/* Carte protocole */}
        <div className="rounded-2xl p-8 space-y-6 animate-fade-in-up" style={{ background: '#0C0F17', border: '1px solid #1D2333' }}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.2)', color: '#00C896' }}>
                {protocol.pathologie}
              </div>
              <h2 className="font-display font-bold text-xl mt-2" style={{ color: '#EDF2F8' }}>{protocol.phase}</h2>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs" style={{ color: '#5A6880' }}>{protocol.duree} · {protocol.seances}</p>
              <p className="text-xs" style={{ color: '#5A6880' }}>Intensité : {protocol.intensite}</p>
            </div>
          </div>

          {/* Séparateur */}
          <div style={{ borderTop: '1px solid #1D2333' }} />

          {/* Exercices */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: '#5A6880' }}>
              Exercices prescrits
            </p>
            {protocol.exercices.map((ex) => {
              const c = NIVEAU_COLORS[ex.niveau] ?? NIVEAU_COLORS.low
              return (
                <div
                  key={ex.num}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all"
                  style={{ background: '#111520', border: '1px solid #1D2333' }}
                >
                  <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: c.bg, color: c.text }}>
                    {ex.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#EDF2F8' }}>{ex.nom}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#5A6880' }}>{ex.params}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div style={{ borderTop: '1px solid #1D2333', paddingTop: '1.5rem' }}>
            <Link
              href="/login"
              className="block w-full text-center py-3 rounded-xl text-sm font-medium btn-shimmer transition-all"
              style={{ color: '#080A0F' }}
            >
              Générer mon premier protocole → Gratuit jusqu&apos;à 3/mois
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
