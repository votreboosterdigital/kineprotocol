'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PricingCTAProps {
  planKey: 'FREE' | 'PRO' | 'CABINET'
  label: string
  highlight: boolean
}

export function PricingCTA({ planKey, label, highlight }: PricingCTAProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    // Plan gratuit → inscription
    if (planKey === 'FREE') {
      router.push('/login')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok) {
        // Non authentifié → rediriger vers login
        if (res.status === 401) { router.push('/login'); return }
        // Afficher un message générique sans exposer l'erreur serveur
        setErrorMsg('Une erreur est survenue. Veuillez réessayer.')
        return
      }

      if (data.url) window.location.assign(data.url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={[
          'w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
          highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700',
        ].join(' ')}
      >
        {loading ? 'Redirection...' : label}
      </button>
      {/* Message d'erreur visible par l'utilisateur (sans détails serveur) */}
      {errorMsg && (
        <p className="text-xs text-red-500 text-center">{errorMsg}</p>
      )}
    </div>
  )
}
