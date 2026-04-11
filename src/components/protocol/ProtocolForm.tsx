'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PillGroup } from '@/components/ui/pill-group'
import { Combobox } from '@/components/ui/combobox'
import type { Pathology, Phase } from '@prisma/client'
import { cn } from '@/lib/utils'

interface ProtocolFormProps {
  pathologies: Pathology[]
  phases: Phase[]
}

interface LiteratureData {
  clinicalConsensus: {
    summary: string
    validatedTreatments: Array<{ intervention: string; evidenceLevel: string; description: string }>
  }
  keyReferences: Array<{ title: string; authors: string; year: number; url: string }>
  clinicalPearlsForProtocol: string[]
  error?: string
}

type Stage = 'acute' | 'subacute' | 'chronic'
type SinsSeverity = 'low' | 'medium' | 'high'
type SinsNature = 'mechanical' | 'inflammatory' | 'neuropathic'
type Sex = 'M' | 'F'
type Level = 'sedentary' | 'amateur' | 'competitive' | 'elite'
type Objective = 'return_activity' | 'return_sport' | 'return_performance'

const RED_FLAGS = [
  'Douleur nocturne non mécanique',
  'Perte de poids inexpliquée',
  'Antécédents de cancer',
  'Déficit neurologique objectivable',
  'Traumatisme récent haute énergie',
]

const STAGE_OPTIONS = [
  { value: 'acute' as Stage, label: 'Aigu' },
  { value: 'subacute' as Stage, label: 'Subaigu' },
  { value: 'chronic' as Stage, label: 'Chronique' },
]

const SEVERITY_OPTIONS = [
  { value: 'low' as SinsSeverity, label: 'Faible' },
  { value: 'medium' as SinsSeverity, label: 'Moyenne' },
  { value: 'high' as SinsSeverity, label: 'Élevée' },
]

const NATURE_OPTIONS = [
  { value: 'mechanical' as SinsNature, label: 'Mécanique' },
  { value: 'inflammatory' as SinsNature, label: 'Inflammatoire' },
  { value: 'neuropathic' as SinsNature, label: 'Neuropathique' },
]

const SEX_OPTIONS = [
  { value: 'M' as Sex, label: 'H' },
  { value: 'F' as Sex, label: 'F' },
]

const LEVEL_OPTIONS = [
  { value: 'sedentary' as Level, label: 'Sédentaire' },
  { value: 'amateur' as Level, label: 'Amateur' },
  { value: 'competitive' as Level, label: 'Compétiteur' },
  { value: 'elite' as Level, label: 'Élite' },
]

const OBJECTIVE_OPTIONS = [
  { value: 'return_activity' as Objective, label: 'Retour activité' },
  { value: 'return_sport' as Objective, label: 'Retour sport' },
  { value: 'return_performance' as Objective, label: 'Retour performance' },
]

const DURATION_OPTIONS = [
  { value: '30' as const, label: '30 min' },
  { value: '45' as const, label: '45 min' },
  { value: '60' as const, label: '60 min' },
]

type DurationStr = '30' | '45' | '60'

const LOADING_STEPS = [
  'Interrogation base clinique...',
  'Analyse du profil...',
  'Construction du protocole...',
  'Vérification des paramètres...',
]

const STEPS = [
  { label: 'Anamnèse', desc: 'Contexte clinique & sécurité' },
  { label: 'Profil', desc: 'Patient & objectif' },
  { label: 'Génération', desc: 'Paramètres de séance' },
]

export function ProtocolForm({ pathologies, phases }: ProtocolFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingStepIdx, setLoadingStepIdx] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [literatureData, setLiteratureData] = useState<LiteratureData | null>(null)
  const [literatureLoading, setLiteratureLoading] = useState(false)
  const [useLiterature, setUseLiterature] = useState(false)

  // Étape 1
  const [pathologyId, setPathologyId] = useState('')
  const [phaseId, setPhaseId] = useState('')
  const [stage, setStage] = useState<Stage | null>(null)
  const [sinsSeverity, setSinsSeverity] = useState<SinsSeverity | null>(null)
  const [sinsIrritability, setSinsIrritability] = useState<SinsSeverity | null>(null)
  const [sinsNature, setSinsNature] = useState<SinsNature | null>(null)
  const [redFlags, setRedFlags] = useState<boolean[]>(Array(5).fill(false))

  // Étape 2
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex | null>(null)
  const [sport, setSport] = useState('')
  const [level, setLevel] = useState<Level | null>(null)
  const [objective, setObjective] = useState<Objective | null>(null)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)

  // Étape 3
  const [sessionDuration, setSessionDuration] = useState<DurationStr>('45')

  const allRedFlagsCleared = redFlags.every(Boolean)

  const pathologyOptions = pathologies.map((p) => ({ value: p.id, label: p.name }))
  const selectedPathologyName = pathologies.find((p) => p.id === pathologyId)?.name ?? ''

  // Reset literature si pathologie change
  useEffect(() => {
    setLiteratureData(null)
    setUseLiterature(false)
  }, [pathologyId])

  // Animation loading progress
  useEffect(() => {
    if (!loading) {
      setLoadingStepIdx(0)
      setLoadingProgress(0)
      return
    }
    const steps = [
      { delay: 0, step: 0, progress: 5 },
      { delay: 3000, step: 1, progress: 25 },
      { delay: 8000, step: 2, progress: 55 },
      { delay: 18000, step: 3, progress: 80 },
    ]
    const timers = steps.map(({ delay, step: s, progress: p }) =>
      setTimeout(() => {
        setLoadingStepIdx(s)
        setLoadingProgress(p)
      }, delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])

  const handleEnrichLiterature = useCallback(async () => {
    if (!selectedPathologyName) return
    setLiteratureLoading(true)
    try {
      const res = await fetch('/api/literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathology: selectedPathologyName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur réseau')
      setLiteratureData(json.data as LiteratureData)
    } catch {
      setLiteratureData(null)
    } finally {
      setLiteratureLoading(false)
    }
  }, [selectedPathologyName])

  useEffect(() => {
    if (useLiterature && !literatureData && selectedPathologyName) {
      handleEnrichLiterature()
    }
  }, [useLiterature, literatureData, selectedPathologyName, handleEnrichLiterature])

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const body = {
        pathologyId,
        phaseId,
        sins: sinsSeverity && sinsIrritability && sinsNature
          ? { severity: sinsSeverity, irritability: sinsIrritability, nature: sinsNature }
          : undefined,
        stage: stage ?? undefined,
        redFlagsCleared: allRedFlagsCleared,
        patientProfile: {
          age: age ? parseInt(age) : 35,
          sex: sex ?? 'M',
          sport: sport || '',
          level: level ?? 'amateur',
          objective: objective ?? 'return_activity',
          sessionsPerWeek,
          sessionDuration: parseInt(sessionDuration) as 30 | 45 | 60,
        },
        constraints: [],
        literatureContext: useLiterature && literatureData
          ? JSON.stringify(literatureData)
          : undefined,
      }

      const res = await fetch('/api/generate-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      router.push(`/protocols/${data.protocol.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="max-w-2xl border-zinc-800 bg-zinc-950">
        <CardContent className="py-12 flex flex-col gap-6">
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0D9488] rounded-full transition-all duration-[3000ms] ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="space-y-2">
            {LOADING_STEPS.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 text-sm transition-all duration-500',
                  i < loadingStepIdx
                    ? 'text-zinc-500'
                    : i === loadingStepIdx
                    ? 'text-zinc-100 font-medium'
                    : 'text-zinc-700'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    i < loadingStepIdx
                      ? 'border-[#0D9488] bg-[#0D9488]'
                      : i === loadingStepIdx
                      ? 'border-[#0D9488] border-t-transparent animate-spin'
                      : 'border-zinc-700'
                  )}
                >
                  {i < loadingStepIdx && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {msg}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 text-center">Durée estimée : 15–25 secondes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                i < step
                  ? 'bg-[#0D9488] border-[#0D9488] text-white'
                  : i === step
                  ? 'border-[#0D9488] text-[#0D9488] bg-transparent'
                  : 'border-zinc-700 text-zinc-600 bg-transparent'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                i === step ? 'text-[#0D9488]' : 'text-zinc-600'
              )}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 transition-colors',
                i < step ? 'bg-[#0D9488]' : 'bg-zinc-800'
              )} />
            )}
          </div>
        ))}
      </div>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-zinc-100">{STEPS[step].label}</CardTitle>
          <p className="text-sm text-zinc-500">{STEPS[step].desc}</p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ───── ÉTAPE 1 — ANAMNÈSE & SÉCURITÉ ───── */}
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Pathologie *</Label>
                <Combobox
                  options={pathologyOptions}
                  value={pathologyId}
                  onChange={setPathologyId}
                  placeholder="Chercher une pathologie..."
                  searchPlaceholder="Tendinopathie, LCA, lombalgie..."
                  emptyText="Aucune pathologie trouvée."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Phase de rééducation *</Label>
                <Select value={phaseId} onValueChange={(v) => setPhaseId(v ?? '')}>
                  <SelectTrigger className="border-zinc-800">
                    <SelectValue placeholder="Choisir une phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.sort((a, b) => a.order - b.order).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Stade clinique</Label>
                <PillGroup options={STAGE_OPTIONS} value={stage} onChange={setStage} />
              </div>

              {/* SINS */}
              <div className="space-y-3 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <p className="text-sm font-medium text-zinc-300">SINS</p>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Sévérité</p>
                    <PillGroup options={SEVERITY_OPTIONS} value={sinsSeverity} onChange={setSinsSeverity} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Irritabilité</p>
                    <PillGroup options={SEVERITY_OPTIONS} value={sinsIrritability} onChange={setSinsIrritability} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Nature</p>
                    <PillGroup options={NATURE_OPTIONS} value={sinsNature} onChange={setSinsNature} size="sm" />
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              <div className="space-y-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <p className="text-sm font-semibold text-amber-400">⚠️ Sécurité — validation obligatoire</p>
                <p className="text-xs text-zinc-500">Cochez &quot;Absent&quot; pour chaque signe avant de continuer</p>
                <div className="space-y-2">
                  {RED_FLAGS.map((flag, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                          redFlags[i]
                            ? 'bg-[#0D9488] border-[#0D9488]'
                            : 'border-zinc-600 group-hover:border-zinc-400'
                        )}
                        onClick={() => setRedFlags((f) => {
                          const next = [...f]
                          next[i] = !next[i]
                          return next
                        })}
                      >
                        {redFlags[i] && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        'text-sm transition-colors',
                        redFlags[i] ? 'text-zinc-400 line-through' : 'text-zinc-300'
                      )}>
                        {flag}
                      </span>
                      <span className={cn(
                        'ml-auto text-xs font-medium flex-shrink-0',
                        redFlags[i] ? 'text-[#0D9488]' : 'text-zinc-600'
                      )}>
                        {redFlags[i] ? 'Absent ✓' : 'À valider'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ───── ÉTAPE 2 — PROFIL PATIENT ───── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-xs">Âge</Label>
                  <Input
                    type="number"
                    placeholder="35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="border-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-xs">Sexe</Label>
                  <PillGroup options={SEX_OPTIONS} value={sex} onChange={setSex} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Sport pratiqué</Label>
                <Input
                  placeholder="Football, tennis, natation..."
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="border-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Niveau</Label>
                <PillGroup options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Objectif</Label>
                <PillGroup options={OBJECTIVE_OPTIONS} value={objective} onChange={setObjective} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">
                  Fréquence — {sessionsPerWeek} séance{sessionsPerWeek > 1 ? 's' : ''}/semaine
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionsPerWeek((n) => Math.max(1, n - 1))}
                    className="w-8 h-8 rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    −
                  </button>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          n <= sessionsPerWeek ? 'bg-[#0D9488]' : 'bg-zinc-700'
                        )}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSessionsPerWeek((n) => Math.min(5, n + 1))}
                    className="w-8 h-8 rounded-full border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ───── ÉTAPE 3 — GÉNÉRATION ───── */}
          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-xs">Durée de séance</Label>
                <PillGroup
                  options={DURATION_OPTIONS}
                  value={sessionDuration}
                  onChange={setSessionDuration}
                />
              </div>

              {/* Toggle PubMed */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800">
                <div>
                  <p className="text-sm text-zinc-300">📚 Enrichir avec sources PubMed</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Injecte la littérature clinique dans la génération</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseLiterature((v) => !v)}
                  disabled={!pathologyId}
                  className={cn(
                    'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
                    useLiterature ? 'bg-[#0D9488]' : 'bg-zinc-700',
                    !pathologyId && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    useLiterature ? 'translate-x-5' : 'translate-x-1'
                  )} />
                </button>
              </div>

              {/* Feedback literature */}
              {useLiterature && (
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                  literatureLoading
                    ? 'border border-zinc-800 text-zinc-500'
                    : literatureData
                    ? 'text-[#2D6A4F]'
                    : 'border border-zinc-800 text-zinc-500'
                )}
                  style={literatureData ? { background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.2)' } : {}}
                >
                  {literatureLoading && (
                    <><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Chargement des sources...</>
                  )}
                  {!literatureLoading && literatureData && (
                    <>🔬 {literatureData.keyReferences?.length ?? 0} sources cliniques seront injectées</>
                  )}
                </div>
              )}

              {/* Récap */}
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-1 text-xs text-zinc-500">
                <p><span className="text-zinc-400">Pathologie :</span> {pathologies.find(p => p.id === pathologyId)?.name ?? '—'}</p>
                <p><span className="text-zinc-400">Stade :</span> {stage ?? '—'} · <span className="text-zinc-400">Séances :</span> {sessionsPerWeek}×/sem · {sessionDuration}&nbsp;min</p>
              </div>
            </>
          )}

          {/* Erreur */}
          {error && (
            error.toLowerCase().includes('quota') || error.includes('Limite') ? (
              <div className="p-4 rounded-lg space-y-2 border" style={{ background: 'rgba(13,148,136,0.05)', borderColor: 'rgba(13,148,136,0.2)' }}>
                <p className="text-sm font-semibold text-zinc-100">Vous avez utilisé vos 3 protocoles ce mois-ci</p>
                <p className="text-sm text-zinc-400">Votre quota se renouvelle le 1er du mois prochain.</p>
                <a href="/billing" className="inline-block mt-1 text-sm font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                  Passer en Pro →
                </a>
              </div>
            ) : (
              <div className="p-3 bg-red-950/50 border border-red-900 rounded-md text-red-400 text-sm">{error}</div>
            )
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="border-zinc-800"
            >
              Précédent
            </Button>

            {step < STEPS.length - 1 ? (
              <div className="relative group">
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={
                    (step === 0 && (!pathologyId || !phaseId || !allRedFlagsCleared))
                  }
                  className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white"
                >
                  Étape suivante
                </Button>
                {step === 0 && !allRedFlagsCleared && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Validez l&apos;absence des 5 drapeaux rouges pour continuer
                  </span>
                )}
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!pathologyId || !phaseId}
                className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white"
              >
                Générer le protocole
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
