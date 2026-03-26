'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Pathology, Phase } from '@prisma/client'
import { cn } from '@/lib/utils'

interface ProtocolFormProps {
  pathologies: Pathology[]
  phases: Phase[]
}

const STEPS = [
  { label: 'Pathologie & Phase', desc: 'Contexte clinique' },
  { label: 'Contexte patient', desc: 'Profil du patient' },
  { label: 'Paramètres séance', desc: 'Organisation des séances' },
]

const LOADING_MESSAGES = [
  'Les agents travaillent...',
  'Enrichissement des exercices...',
  'Rédaction version patient...',
  'Finalisation du protocole...',
]

export function ProtocolForm({ pathologies, phases }: ProtocolFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    pathologyId: '',
    phaseId: '',
    patientAge: '',
    patientSport: '',
    patientLevel: '',
    sessionDuration: '45',
    sessionsPerWeek: '3',
    constraints: '',
  })

  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [loading])

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setLoadingMsgIdx(0)
    try {
      const res = await fetch('/api/generate-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathologyId: form.pathologyId,
          phaseId: form.phaseId,
          patientAge: form.patientAge ? parseInt(form.patientAge) : undefined,
          patientSport: form.patientSport || undefined,
          patientLevel: form.patientLevel || undefined,
          sessionDuration: parseInt(form.sessionDuration),
          sessionsPerWeek: parseInt(form.sessionsPerWeek),
          constraints: form.constraints ? form.constraints.split('\n').filter(Boolean) : [],
        }),
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
      <Card className="max-w-2xl">
        <CardContent className="py-16 flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
          <div className="text-center">
            <p className="text-lg font-semibold text-sky-700 dark:text-sky-400 transition-all duration-500">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
            <p className="text-sm text-slate-500 mt-2">Durée estimée : 15–25 secondes</p>
          </div>
          <div className="flex gap-1">
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === loadingMsgIdx ? 'bg-sky-500 w-4' : 'bg-slate-300'
                )}
              />
            ))}
          </div>
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
                i < step ? 'bg-sky-500 border-sky-500 text-white' :
                i === step ? 'border-sky-500 text-sky-600 bg-sky-50 dark:bg-sky-900/20' :
                'border-slate-300 text-slate-400 bg-white dark:bg-slate-800'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                i === step ? 'text-sky-600' : 'text-slate-400'
              )}>{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 transition-colors',
                i < step ? 'bg-sky-500' : 'bg-slate-200'
              )} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].label}</CardTitle>
          <CardDescription>{STEPS[step].desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Pathologie *</Label>
                <Select value={form.pathologyId} onValueChange={(v) => setForm(f => ({ ...f, pathologyId: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir une pathologie" /></SelectTrigger>
                  <SelectContent>
                    {pathologies.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phase de rééducation *</Label>
                <Select value={form.phaseId} onValueChange={(v) => setForm(f => ({ ...f, phaseId: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir une phase" /></SelectTrigger>
                  <SelectContent>
                    {phases.sort((a, b) => a.order - b.order).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Âge patient</Label>
                <Input type="number" placeholder="35" value={form.patientAge}
                  onChange={e => setForm(f => ({ ...f, patientAge: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Sport pratiqué</Label>
                <Input placeholder="Football" value={form.patientSport}
                  onChange={e => setForm(f => ({ ...f, patientSport: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={form.patientLevel} onValueChange={(v) => setForm(f => ({ ...f, patientLevel: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Niveau" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="débutant">Débutant</SelectItem>
                    <SelectItem value="amateur">Amateur</SelectItem>
                    <SelectItem value="élite">Élite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durée séance (min)</Label>
                  <Input type="number" value={form.sessionDuration}
                    onChange={e => setForm(f => ({ ...f, sessionDuration: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Séances / semaine</Label>
                  <Input type="number" value={form.sessionsPerWeek}
                    onChange={e => setForm(f => ({ ...f, sessionsPerWeek: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contraintes spécifiques (une par ligne)</Label>
                <Textarea
                  placeholder="pas de matériel&#10;douleur résiduelle 3/10"
                  value={form.constraints}
                  onChange={e => setForm(f => ({ ...f, constraints: e.target.value }))}
                  rows={3}
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
            >
              Précédent
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && (!form.pathologyId || !form.phaseId)}
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!form.pathologyId || !form.phaseId}
              >
                Générer le protocole avec Claude AI
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
