'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, User, Building2, Phone, Mail, Loader2 } from 'lucide-react'

interface ProfileData {
  firstName: string | null
  lastName: string | null
  title: string | null
  cabinetName: string | null
  phone: string | null
  email: string | null
  onboardingCompleted: boolean
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  FREE: { label: 'Gratuit', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  PRO: { label: 'Pro', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  CABINET: { label: 'Cabinet', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
}

function Initials({ firstName, lastName, size = 'lg' }: { firstName?: string | null; lastName?: string | null; size?: 'sm' | 'lg' }) {
  const initials = [firstName, lastName].filter(Boolean).map(n => n![0].toUpperCase()).join('') || '?'
  return (
    <div className={`${size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-8 h-8 text-sm'} rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg`}>
      {initials}
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [plan, setPlan] = useState<string>('FREE')
  const [form, setForm] = useState({ firstName: '', lastName: '', title: '', cabinetName: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    Promise.all([
      fetch('/api/profile', { signal: controller.signal }).then(r => {
        if (!r.ok) throw new Error(`Profil: ${r.status}`)
        return r.json()
      }),
      fetch('/api/billing/info', { signal: controller.signal }).then(r => {
        if (!r.ok) return { plan: 'FREE' }
        return r.json()
      }),
    ]).then(([p, b]) => {
      clearTimeout(timeout)
      setProfile(p)
      setPlan(b.plan ?? 'FREE')
      setForm({
        firstName: p.firstName ?? '',
        lastName: p.lastName ?? '',
        title: p.title ?? '',
        cabinetName: p.cabinetName ?? '',
        phone: p.phone ?? '',
      })
    }).catch(err => {
      clearTimeout(timeout)
      console.error('Profile load error:', err)
      if (err.name === 'AbortError') {
        setLoadError('Le chargement a pris trop longtemps. Veuillez réessayer.')
      } else {
        setLoadError('Impossible de charger votre profil. Veuillez réessayer.')
      }
    })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const updated = await res.json()
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-400 text-sm">{loadError}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.FREE

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* En-tête profil */}
      <div className="flex items-center gap-6 p-6 rounded-2xl shadow-xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid #1e2432' }}>
        <Initials firstName={form.firstName} lastName={form.lastName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">
              {form.firstName || form.lastName
                ? `${form.title ? form.title + ' ' : ''}${form.firstName} ${form.lastName}`.trim()
                : 'Mon profil'}
            </h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${planInfo.color}`}>
              {planInfo.label}
            </span>
          </div>
          {profile.email && (
            <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </p>
          )}
          {form.cabinetName && (
            <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {form.cabinetName}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Informations personnelles */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(56,189,248,0.1)' }}>
                <User className="h-4 w-4" style={{ color: '#38bdf8' }} />
              </div>
              <div>
                <CardTitle className="text-base">Informations personnelles</CardTitle>
                <CardDescription>Affiché dans les en-têtes et salutations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Dr., Kiné, M., Mme"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Jean-Pierre"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Martin"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Adresse email</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm" style={{ background: '#0e1117', border: '1px solid #1e2432', color: '#64748b' }}>
                <Mail className="h-4 w-4" />
                {profile.email}
                <span className="ml-auto text-xs">Non modifiable</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cabinet */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <Building2 className="h-4 w-4" style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <CardTitle className="text-base">Cabinet</CardTitle>
                <CardDescription>Affiché sur les PDFs patient</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cabinetName">Nom du cabinet</Label>
              <Input
                id="cabinetName"
                placeholder="Cabinet de Kinésithérapie du Parc"
                value={form.cabinetName}
                onChange={e => setForm(f => ({ ...f, cabinetName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  placeholder="+33 6 00 00 00 00"
                  className="pl-9"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Plan */}
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#0e1117', border: '1px solid #1e2432' }}>
          <div>
            <p className="text-sm font-medium">Abonnement actuel</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Gérez votre plan et vos moyens de paiement</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${planInfo.color} border-0`}>{planInfo.label}</Badge>
            <Button variant="outline" size="sm" onClick={() => window.location.assign('/billing')}>
              Gérer →
            </Button>
          </div>
        </div>

        {/* Sauvegarde */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="min-w-[140px]">
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</>
            ) : saved ? (
              <><CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />Enregistré !</>
            ) : (
              'Enregistrer'
            )}
          </Button>
          {saved && <p className="text-sm text-green-600 dark:text-green-400">Vos modifications ont été sauvegardées.</p>}
        </div>
      </form>
    </div>
  )
}
