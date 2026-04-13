'use client'
import { useEffect, useRef, useState } from 'react'
import type { ProtocolGenerationState } from '@/hooks/useProtocolGeneration'
import { cn } from '@/lib/utils'

const STEPS = [
  'Chargement des données cliniques…',
  'Génération du protocole clinique…',
  'Enrichissement des exercices…',
  'Rédaction version patient…',
  'Finalisation…',
]

const MOSELEY_QUOTES = [
  '"La douleur est un défenseur, pas un offenseur."',
  '"Comprendre la douleur est déjà une forme de traitement."',
  '"Motion is lotion — le mouvement progressif nourrit vos tissus."',
  '"Une poussée de douleur n\'est pas une rechute."',
]

interface ProtocolGenerationProgressProps {
  state: ProtocolGenerationState
  onDone: () => void
}

export function ProtocolGenerationProgress({ state, onDone }: ProtocolGenerationProgressProps) {
  const [quoteIdx] = useState(() => Math.floor(Math.random() * MOSELEY_QUOTES.length))
  const doneCalledRef = useRef(false)

  // Appel onDone 800ms après le passage à "done"
  useEffect(() => {
    if (state.status === 'done' && !doneCalledRef.current) {
      doneCalledRef.current = true
      const timer = setTimeout(onDone, 800)
      return () => clearTimeout(timer)
    }
  }, [state.status, onDone])

  const isVisible =
    state.status === 'generating' ||
    state.status === 'saving' ||
    state.status === 'done'

  if (!isVisible) return null

  // Index de l'étape active (0-based)
  const activeIdx = state.currentStep ? state.currentStep.step - 1 : -1
  const total = state.currentStep?.total ?? STEPS.length
  // Progression : étape courante / total (entre 0 et 1)
  const progressPct =
    state.status === 'done'
      ? 100
      : state.status === 'saving'
      ? 96
      : activeIdx >= 0
      ? Math.round((activeIdx / total) * 100)
      : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/70">
      <div
        className="w-full max-w-lg mx-4 rounded-2xl border p-8 space-y-8 shadow-2xl"
        style={{ background: '#0d1117', borderColor: 'rgba(13,148,136,0.2)' }}
      >
        {/* Titre */}
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-widest uppercase text-[#0D9488]">
            KinéProtocol AI
          </p>
          <h2 className="text-xl font-semibold text-zinc-100">
            Protocole en construction
          </h2>
        </div>

        {/* Barre de progression */}
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0D9488] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Liste des étapes */}
        <div className="space-y-3">
          {STEPS.map((label, i) => {
            const isDone = i < activeIdx || state.status === 'done' || state.status === 'saving'
            const isCurrent = i === activeIdx && state.status === 'generating'
            const isPending = !isDone && !isCurrent

            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 text-sm transition-all duration-300',
                  isDone ? 'text-zinc-500' : isCurrent ? 'text-zinc-100 font-medium' : 'text-zinc-700'
                )}
              >
                {/* Icône état */}
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                    isDone
                      ? 'border-[#0D9488] bg-[#0D9488]'
                      : isCurrent
                      ? 'border-[#0D9488] border-t-transparent animate-spin'
                      : 'border-zinc-700'
                  )}
                >
                  {isDone && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isPending && (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  )}
                </div>
                {label}
              </div>
            )
          })}

          {/* Étape de sauvegarde (apparaît après le stream) */}
          <div
            className={cn(
              'flex items-center gap-3 text-sm transition-all duration-300',
              state.status === 'done'
                ? 'text-zinc-500'
                : state.status === 'saving'
                ? 'text-zinc-100 font-medium'
                : 'text-zinc-700'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                state.status === 'done'
                  ? 'border-[#0D9488] bg-[#0D9488]'
                  : state.status === 'saving'
                  ? 'border-[#0D9488] border-t-transparent animate-spin'
                  : 'border-zinc-700'
              )}
            >
              {state.status === 'done' && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {state.status !== 'done' && state.status !== 'saving' && (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              )}
            </div>
            Sauvegarde du protocole…
          </div>
        </div>

        {/* Citation Moseley */}
        <div
          className="p-4 rounded-xl border space-y-1"
          style={{ background: 'rgba(13,148,136,0.04)', borderColor: 'rgba(13,148,136,0.12)' }}
        >
          <p className="text-xs font-medium text-[#0D9488] uppercase tracking-wider">
            Le saviez-vous ?
          </p>
          <p className="text-sm text-zinc-400 italic leading-relaxed">
            {MOSELEY_QUOTES[quoteIdx]}
          </p>
          <p className="text-xs text-zinc-600">— Lorimer Moseley</p>
        </div>
      </div>
    </div>
  )
}
