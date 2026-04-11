'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronRight, ClipboardList, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react'

/* ─── Types ─── */
interface Stats {
  total: number
  thisMonth: number
  limit: number
  plan: string
  recent: {
    id: string
    pathology: string
    phase: string
    exerciseCount: number
    createdAt: string
  }[]
}

interface Profile {
  firstName: string | null
  lastName: string | null
  title: string | null
}

/* ─── Toast onboarding ─── */
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
      setTimeout(() => setStep(1), 40000),
      setTimeout(() => setStep(2), 110000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [protocolId])

  if (protocolId) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-green-800/50 bg-zinc-900 shadow-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-sm text-zinc-100">Protocole démo prêt !</p>
            <p className="text-xs text-slate-500">Votre premier protocole a été généré.</p>
          </div>
        </div>
        <Button size="sm" className="w-full" onClick={() => router.push(`/protocols/${protocolId}?demo=true`)}>
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
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm text-zinc-100">Génération de votre démo</p>
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
              i === step ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
              : i < step ? 'opacity-40' : 'opacity-20'
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
      {/* Animation robot kiné */}
      <div className="flex justify-center py-1">
        <svg width="80" height="48" viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="28" y="16" width="24" height="20" rx="4" fill="#3b82f6" opacity="0.9"/>
          <rect x="32" y="6" width="16" height="12" rx="3" fill="#1d4ed8"/>
          <circle cx="36" cy="11" r="2" fill="#bfdbfe"/>
          <circle cx="44" cy="11" r="2" fill="#bfdbfe"/>
          <line x1="40" y1="6" x2="40" y2="2" stroke="#60a5fa" strokeWidth="1.5"/>
          <circle cx="40" cy="2" r="1.5" fill="#60a5fa">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/>
          </circle>
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0 28 26;-20 28 26;0 28 26" dur="1.4s" repeatCount="indefinite"/>
            <rect x="16" y="22" width="12" height="6" rx="3" fill="#2563eb"/>
            <rect x="10" y="20" width="7" height="9" rx="1.5" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1"/>
            <line x1="12" y1="23" x2="15" y2="23" stroke="#3b82f6" strokeWidth="1"/>
            <line x1="12" y1="25" x2="15" y2="25" stroke="#3b82f6" strokeWidth="1"/>
          </g>
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0 52 26;20 52 26;0 52 26" dur="1.4s" repeatCount="indefinite"/>
            <rect x="52" y="22" width="12" height="6" rx="3" fill="#2563eb"/>
            <circle cx="67" cy="25" r="3" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
            <path d="M64 25 Q62 20 60 22" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
          </g>
          <rect x="32" y="36" width="6" height="10" rx="2" fill="#1d4ed8">
            <animate attributeName="height" values="10;8;10" dur="0.8s" repeatCount="indefinite"/>
          </rect>
          <rect x="42" y="36" width="6" height="10" rx="2" fill="#1d4ed8">
            <animate attributeName="height" values="8;10;8" dur="0.8s" repeatCount="indefinite"/>
          </rect>
          <polyline points="2,44 8,44 10,38 13,48 16,36 19,44 24,44" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
          </polyline>
          <polyline points="56,44 62,44 64,38 67,48 70,36 73,44 78,44" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.5">
            <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
          </polyline>
        </svg>
      </div>
      <p className="text-xs text-slate-400 text-center">~4 min · votre protocole apparaîtra ici</p>
    </div>
  )
}

/* ─── Helpers ─── */
function getGreeting(firstName: string | null) {
  const hour = new Date().getHours()
  const salut = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  return firstName ? `${salut}, ${firstName}` : salut
}

function formatRelativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return `Il y a ${days} j`
}

function getDateLabel() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  FREE: { label: 'Gratuit', cls: 'bg-zinc-700 text-zinc-300' },
  PRO: { label: 'Pro', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  CABINET: { label: 'Cabinet', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
}

/* ─── Page ─── */
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [protocolId, setProtocolId] = useState<string | null>(null)

  useEffect(() => {
    // Chargement parallèle
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.ok ? r.json() : null),
      fetch('/api/profile').then(r => r.ok ? r.json() : null),
    ]).then(([s, p]) => {
      if (s) setStats(s)
      if (p) setProfile(p)
    })

    // Onboarding
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

  const planInfo = PLAN_BADGE[stats?.plan ?? 'FREE'] ?? PLAN_BADGE.FREE
  const usagePct = stats ? Math.min((stats.thisMonth / stats.limit) * 100, 100) : 0
  const usageColor = usagePct >= 90 ? 'bg-red-500' : usagePct >= 60 ? 'bg-amber-500' : 'bg-sky-500'

  return (
    <>
      {showToast && <OnboardingToast protocolId={protocolId} />}

      <div className="space-y-8 max-w-5xl">

        {/* ── Hero greeting ── */}
        <div className="relative overflow-hidden rounded-2xl border border-border p-8 shadow-xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
          {/* Motif décoratif */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #38bdf8 0%, transparent 50%), radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 40%)'
          }} />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-slate-400 capitalize">{getDateLabel()}</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {getGreeting(profile?.firstName ?? null)} 👋
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                {stats?.total === 0
                  ? 'Générez votre premier protocole de rééducation IA.'
                  : `${stats?.total ?? '—'} protocole${(stats?.total ?? 0) > 1 ? 's' : ''} généré${(stats?.total ?? 0) > 1 ? 's' : ''} au total · continuez sur votre lancée.`}
              </p>
            </div>
            <Link href="/protocols/new">
              <Button className="shrink-0 gap-2 bg-sky-500 hover:bg-sky-400 text-white border-0 shadow-lg shadow-sky-900/30">
                <Plus className="h-4 w-4" />
                Nouveau protocole
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Métriques ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total protocoles */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(56,189,248,0.1)' }}>
                <ClipboardList className="h-4 w-4 text-sky-400" />
              </div>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.total ?? '—'}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Protocoles générés</p>
          </div>

          {/* Ce mois */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <TrendingUp className="h-4 w-4 text-violet-400" />
              </div>
              <span className="text-xs text-muted-foreground">Ce mois</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats ? stats.thisMonth : '—'}
              {stats && stats.limit < 999 && (
                <span className="text-lg font-normal text-muted-foreground"> / {stats.limit}</span>
              )}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${usageColor}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.limit === 999 ? 'Illimité' : `${stats?.limit ?? '—'} max · plan ${planInfo.label}`}
            </p>
          </div>

          {/* Plan */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <Badge className={`text-xs font-medium border-0 ${planInfo.cls}`}>{planInfo.label}</Badge>
            </div>
            <p className="text-lg font-bold text-foreground">Abonnement</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats?.plan === 'FREE' ? '3 protocoles/mois inclus' :
               stats?.plan === 'PRO' ? '50 protocoles/mois' : 'Protocoles illimités'}
            </p>
            <Link href="/billing" className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline mt-2">
              Gérer <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ── Activité récente ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Activité récente</h2>
            <Link href="/protocols" className="inline-flex items-center gap-1 text-sm text-sky-400 hover:underline">
              Voir tout <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {!stats || stats.recent.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Aucun protocole pour l&apos;instant</p>
              <p className="text-xs text-muted-foreground mt-1">Générez votre premier protocole IA en moins de 4 minutes</p>
              <Link href="/protocols/new">
                <Button size="sm" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" /> Créer un protocole
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent.map((p) => (
                <Link key={p.id} href={`/protocols/${p.id}`} className="block group">
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm hover:border-sky-700 hover:shadow-md transition-all duration-150">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                      <ClipboardList className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{p.pathology}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.phase} · {p.exerciseCount} exercice{p.exerciseCount > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{formatRelativeDate(p.createdAt)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-sky-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Compléter son profil (si vide) ── */}
        {profile && !profile.firstName && (
          <div className="flex items-center gap-4 rounded-xl border px-5 py-4" style={{ borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.05)' }}>
            <span className="text-2xl">✨</span>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#F59E0B' }}>Complétez votre profil</p>
              <p className="text-xs mt-0.5 text-muted-foreground">Ajoutez votre prénom pour personnaliser votre espace.</p>
            </div>
            <Link href="/profile">
              <Button size="sm" variant="outline" style={{ borderColor: 'rgba(245,158,11,0.5)', color: '#F59E0B' }}>
                Compléter →
              </Button>
            </Link>
          </div>
        )}

      </div>
    </>
  )
}
