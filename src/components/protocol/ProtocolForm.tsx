'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Pathology, Phase } from '@prisma/client'

interface ProtocolFormProps {
  pathologies: Pathology[]
  phases: Phase[]
}

export function ProtocolForm({ pathologies, phases }: ProtocolFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Générer un protocole</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label>Phase *</Label>
              <Select value={form.phaseId} onValueChange={(v) => setForm(f => ({ ...f, phaseId: v ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="Choisir une phase" /></SelectTrigger>
                <SelectContent>
                  {phases.sort((a, b) => a.order - b.order).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Âge patient</Label>
              <Input type="number" placeholder="35" value={form.patientAge}
                onChange={e => setForm(f => ({ ...f, patientAge: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sport</Label>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durée séance (min)</Label>
              <Input type="number" value={form.sessionDuration}
                onChange={e => setForm(f => ({ ...f, sessionDuration: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Séances/semaine</Label>
              <Input type="number" value={form.sessionsPerWeek}
                onChange={e => setForm(f => ({ ...f, sessionsPerWeek: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contraintes spécifiques (une par ligne)</Label>
            <Textarea placeholder="pas de matériel&#10;douleur résiduelle 3/10"
              value={form.constraints}
              onChange={e => setForm(f => ({ ...f, constraints: e.target.value }))} rows={3} />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
          )}
          <Button type="submit" disabled={!form.pathologyId || !form.phaseId || loading} className="w-full">
            {loading ? 'Génération en cours (30-60s)...' : 'Générer le protocole avec Claude AI'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
